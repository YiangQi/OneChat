## 1. 脚本加载基础

- [x] 1.1 增加读取或加载 `online/common_inject.js` 内容的能力。
- [x] 1.2 增加按 `AIModel.script` 读取或加载 provider `inject.js` 内容的能力。
- [x] 1.3 为脚本缺失、加载失败和空脚本添加安全返回与诊断日志。
- [x] 1.4 为脚本内容注入准备安全的 JavaScript 序列化包装工具，避免字符串转义破坏执行。

## 2. CallBridge 注入

- [x] 2.1 在 webview 页面上下文中注入最小 `CallBridge`，包含 `addEventListener`、`dispatchEvent` 和 `invoke`。
- [x] 2.2 为 `CallBridge` 增加事件 listener 存储、异常隔离和未注册事件 no-op。
- [x] 2.3 为 `CallBridge.invoke` 增加诊断日志和可读取的事件队列。
- [x] 2.4 为 bridge 注入增加页面上下文标记，避免重复创建破坏已有 listener。

## 3. Webview 注入生命周期

- [x] 3.1 在 `WebViewContainer.vue` 中接入注入流程，等待 webview 可执行脚本后启动。
- [x] 3.2 按 `CallBridge` -> provider script -> `common_inject.js` 顺序执行注入。
- [x] 3.3 为 provider/common 注入增加同一页面上下文内的重复注入保护。
- [x] 3.4 在 webview 完整刷新后允许重新注入新的页面上下文。
- [x] 3.5 在注入失败时记录错误并保持 webview 可浏览。

## 4. Composer 事件分发迁移

- [x] 4.1 将 `useWebviewDispatch.ts` 从直接调用 `window.onXxx` 改为调用 `CallBridge.dispatchEvent(...)`。
- [x] 4.2 确认文本变化、发送、网页输入框、网页侧边栏、登录、新建对话、添加图片和添加文件事件名称与 `common_inject.js` 一致。
- [x] 4.3 保留附件 payload 的 base64 传输和 webview 侧 ArrayBuffer 还原逻辑。
- [x] 4.4 保持 active-tab 和 all-tabs 目标选择逻辑不变。
- [x] 4.5 确保未 ready webview 或缺失 `CallBridge` 时安全失败，不影响其他目标。

## 5. 页面状态同步

- [x] 5.1 从 composer store 和 theme store 组装 provider 初始化参数。
- [x] 5.2 注入成功并加载完成后分发 `loadEnded` 事件。
- [x] 5.3 在 `did-navigate` 和 `did-navigate-in-page` 后分发 `urlChanged` 事件。
- [x] 5.4 同步网页输入框可见性、网页侧边栏可见性、主题、语言、深度思考和联网搜索默认值。
- [x] 5.5 避免初始化事件在同一页面上下文中不必要地重复发送。

## 6. 回传事件处理

- [x] 6.1 捕获 `CallBridge.invoke("webLoadEnded")` 并记录为页面加载完成状态。
- [x] 6.2 捕获 `webConversationListUpdated`、`webConversationChanged` 和 `webModelListUpdated` 到可诊断队列。
- [x] 6.3 为后续会话列表 UI 保留 renderer 可消费的事件出口。

## 7. 测试与验证

- [x] 7.1 添加 CallBridge 单元测试，覆盖 listener 注册、事件分发、异常隔离和未注册事件 no-op。
- [x] 7.2 添加 WebViewContainer 注入测试，验证注入顺序、缺失脚本处理和重复注入保护。
- [x] 7.3 更新 `useWebviewDispatch` 测试，断言调用 `CallBridge.dispatchEvent` 而不是直接调用 `onXxx`。
- [x] 7.4 添加 provider/common 集成测试，验证 common 脚本能注册 provider handler。
- [x] 7.5 添加 e2e 测试，打开至少一个模型后验证 BottomComposer 文本同步和发送事件能到达页面。
- [x] 7.6 运行相关 Vitest、Playwright e2e 和生产构建。
