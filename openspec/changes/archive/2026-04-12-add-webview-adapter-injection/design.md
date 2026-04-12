## Context

`online/online.json` 已经为每个 AI 网站配置了 `script` 字段，例如 `openai_chatgpt/inject.js`。这些 provider 脚本定义了 `onInputTextChanged`、`onInputTextSended`、`onSidebarVisibleChanged`、`onNewChatButtonClicked`、`hookHttpsRequest` 等函数。

`online/common_inject.js` 的职责是把 provider 暴露的函数注册到 `CallBridge` 事件系统中，并提供 `invokeBrowserMethod(...)` 让 provider 脚本把页面状态回传给客户端。当前 `WebViewContainer.vue` 只加载 webview URL，没有注入 provider 脚本、common 脚本或 `CallBridge`。当前 `useWebviewDispatch.ts` 直接执行 `window.onXxx(...)`，没有走 common 脚本定义的事件注册模型。

## Goals / Non-Goals

**Goals:**
- 每个 webview 在可注入时拥有一个稳定的 `CallBridge`。
- 每个 webview 注入自己的 provider `inject.js` 和公共 `common_inject.js`。
- 保证注入顺序正确：`CallBridge` -> provider script -> `common_inject.js`。
- BottomComposer 通过 `CallBridge.dispatchEvent(...)` 分发语义事件。
- 页面加载完成和站内导航后，将客户端当前状态同步给 provider adapter。
- 重复注入和重复 hook 必须安全。
- 缺失脚本、未实现动作或脚本异常不得破坏 webview 或 composer。

**Non-Goals:**
- 这次不实现完整会话列表 UI。
- 这次不统一重写所有 provider 的 DOM 选择器。
- 这次不保证每个 provider 的附件上传都完全可用，只保证桥接和 payload 传输协议一致。
- 这次不引入新的第三方脚本注入库。

## Decisions

### 使用 executeJavaScript 注入，而不是 webview preload

第一阶段在 `WebViewContainer.vue` 的 webview 生命周期事件中通过 `executeJavaScript` 注入 bridge、provider 脚本和 common 脚本。

选择原因：
- 当前代码已经通过 renderer 的 webview 引用进行分发。
- `model.script` 已在 renderer 可见，适合按 tab 注入不同 provider。
- 不需要处理 webview preload 的打包路径、权限和参数传递。

备选方案是为 webview 配置 preload。它能更早 hook 页面请求，但会增加 provider script 路径传递、生产路径和安全边界复杂度。若后续发现某些站点必须在页面应用脚本前 hook 请求，可以再作为第二阶段演进。

### 在页面上下文中建立最小 CallBridge

`CallBridge` 应提供：
- `addEventListener(name, fn)`：供 `common_inject.js` 注册 provider handler。
- `dispatchEvent(name, ...args)`：供 BottomComposer 动作分发调用。
- `invoke(name, ...args)`：供 provider 通过 `invokeBrowserMethod` 回传状态。

`invoke` 第一阶段可将事件写入页面侧队列并打印诊断日志；若需要 renderer 状态同步，可再通过 webview `ipc-message` 或 `executeJavaScript` 轮询队列取出事件。

### Provider 脚本先于 common 脚本

provider `inject.js` 必须先执行，确保 `common_inject.js` 检查 `typeof onInputTextChanged == "function"` 时能看到这些函数。common 脚本只负责注册已经存在的 handler。

### 用注入标记避免重复注册和重复 hook

页面上下文应维护 OneChat 注入状态，例如：

```text
window.__ONECHAT_INJECTION__ = {
  bridgeReady: true,
  providerScript: "<model.script>",
  providerInjected: true,
  commonInjected: true,
  eventsRegistered: true
}
```

同一页面生命周期内重复触发 `dom-ready` 或 `did-finish-load` 时，应复用 bridge，并避免重复执行 provider/common 脚本。页面完整刷新后上下文重建，允许重新注入。

### BottomComposer 只分发事件名

`useWebviewDispatch.ts` 应从直接调用 `onInputTextChanged` 改为调用：

```text
CallBridge.dispatchEvent("inputTextChanged", text)
CallBridge.dispatchEvent("inputTextSended")
CallBridge.dispatchEvent("sidebarVisibleChanged", visible)
CallBridge.dispatchEvent("addFileButtonClicked", payload)
```

这样 provider 函数命名差异由 `common_inject.js` 统一处理，例如事件 `chatNewButtonClicked` 对应 provider 函数 `onNewChatButtonClicked`。

### 页面生命周期同步

注入成功后，系统应发送初始化事件：

```text
loadEnded({
  isInputBoxVisible,
  isSidebarVisible,
  isDeepThinkChecked,
  isWebSearchChecked,
  appTheme,
  appLanguage
})
```

当 webview 发生 `did-navigate` 或 `did-navigate-in-page` 时，应发送 `urlChanged`，让 provider 重新隐藏网页输入框、网页侧边栏或同步主题。

## Risks / Trade-offs

- Provider 脚本重复 hook `fetch` / `XMLHttpRequest` -> 使用页面注入标记避免重复执行 provider/common 脚本。
- 注入时机晚于网站首批请求 -> 第一阶段接受该限制；若会话列表捕获不稳定，再评估 preload 方案。
- 脚本路径在开发和打包环境不同 -> 优先通过现有 `online://` 协议或主进程读取在线资源，避免 renderer 直接拼文件系统路径。
- `CallBridge.invoke` 暂不接入完整 UI 状态 -> 第一阶段保证日志和安全队列，后续再把 `webConversationListUpdated` 等事件映射到会话 UI。
- Provider DOM 选择器易失效 -> 桥接层只保证事件到达；具体站点 DOM 修复仍在各 provider `inject.js` 中完成。
- `executeJavaScript` 字符串拼接可能引入转义问题 -> 注入脚本内容必须使用安全序列化包装，事件参数必须 JSON 序列化并处理附件 payload。

## Migration Plan

1. 增加脚本加载能力，能读取 `common_inject.js` 和 `model.script` 内容。
2. 在 `WebViewContainer.vue` 中建立 webview 注入生命周期。
3. 注入 `CallBridge`，再注入 provider 脚本和 common 脚本。
4. 将 `useWebviewDispatch.ts` 改为通过 `CallBridge.dispatchEvent` 分发。
5. 注入完成后发送 `loadEnded`，导航后发送 `urlChanged`。
6. 为重复注入、缺失 provider 脚本、未支持事件、附件 payload 添加测试。
7. 用至少一个真实 provider 的 e2e 验证 BottomComposer 文本同步和发送路径。

回滚方式：保留 BottomComposer UI，恢复 `useWebviewDispatch.ts` 直接调用 `onXxx` 的旧路径，并移除 WebViewContainer 注入流程。

## Open Questions

- `CallBridge.invoke` 的反向事件第一阶段只记录日志，还是立即进入 renderer store？
- 页面主题枚举应沿用注释中的 `0/1/2`，还是从当前 theme store 映射为更明确的字符串？
- 是否需要为 provider 脚本增加版本或能力声明，帮助 UI 判断哪些按钮可用？
