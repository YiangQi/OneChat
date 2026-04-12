## Why

底部全局输入框已经能收集用户操作，但当前 webview 还没有统一注入 `common_inject.js` 和各站点自己的 `inject.js`。这会让按钮只能尝试直接调用页面函数，缺少稳定的事件注册、页面加载同步和站点适配器生命周期，导致输入同步、发送、侧边栏切换、新建对话、附件上传等动作无法可靠工作。

## What Changes

- 为每个 webview 建立 `CallBridge` 事件桥，用于站点脚本注册事件、接收 BottomComposer 动作、向客户端回传页面状态。
- 在 webview 页面 ready 后注入模型配置中的 provider `inject.js`，并注入 `online/common_inject.js`。
- 保证注入顺序为 `CallBridge` -> provider `inject.js` -> `common_inject.js`，使 common 脚本能注册 provider 暴露的 `onXxx` 处理器。
- 将 BottomComposer 的 webview 动作分发从直接调用 `window.onXxx` 调整为通过 `CallBridge.dispatchEvent(...)` 触发语义事件。
- 在页面加载、刷新、站内跳转后重新同步初始状态，例如网页输入框显示、网页侧边栏显示、主题和语言。
- 防止重复注入导致多次 monkey-patch `fetch` / `XMLHttpRequest` 或重复注册事件。
- 为注入成功、缺失脚本、未支持动作、脚本异常等情况提供可诊断日志和安全 no-op。

## Capabilities

### New Capabilities
- `webview-adapter-injection`: 定义 webview 注入 CallBridge、provider 脚本、common 脚本，以及通过事件桥分发和回传页面状态的能力。

### Modified Capabilities

无。

## Impact

- Renderer webview 生命周期：`WebViewContainer.vue` 需要负责脚本注入、加载完成同步和导航同步。
- Composer 分发层：`useWebviewDispatch.ts` 需要通过 `CallBridge.dispatchEvent` 分发事件，而不是直接调用 provider 全局函数。
- 在线资源加载：需要读取或加载 `online/common_inject.js` 和 `model.script` 指向的 provider 脚本。
- Provider 适配器：`online/*/inject.js` 中已有的 `onXxx` 与 `hookHttpsRequest` 将成为正式适配入口。
- 测试：需要覆盖注入顺序、重复注入保护、事件分发、页面加载同步、缺失脚本安全失败和回归 e2e。
