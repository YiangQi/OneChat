## Why

当前 webview provider 已经可以通过 `invokeBrowserMethod("webConversationListUpdated", ...)` 和 `invokeBrowserMethod("webConversationChanged", ...)` 回传会话信息，但 renderer 端只把这些事件作为诊断日志处理，侧边栏无法展示或同步网页历史会话。

这个变更让打开中的模型页能够把网页历史会话同步到 OneChat 侧边栏，用户可以在 OneChat 侧边栏查看、选中并切换历史记录，同时保持页面内切换和侧边栏选中状态一致。

## What Changes

- 在模型侧边栏中把打开中的模型项展示为一层树形结构：模型节点下显示该模型当前打开 webview 同步到的历史会话。
- 当 provider 回传 `webConversationListUpdated` 时，renderer 将会话列表写入运行时会话状态，并显示在对应模型节点下。
- 当 provider 回传 `webConversationChanged` 时，renderer 更新对应模型节点下的选中会话。
- 点击侧边栏中的历史会话时，系统向已打开的对应 webview 分发 `conversationClicked(conversationId, conversationTitle)`，由 provider 完成网页内切换。
- 不自动打开模型 tab：未打开的模型不显示历史会话，用户不能通过历史会话点击隐式打开模型。
- 关闭模型 tab 后清除该模型的历史会话列表和选中状态。
- 以 ChatGLM 作为首个实站验证目标，更新其历史接口捕获和会话切换注入逻辑。

## Capabilities

### New Capabilities

- `model-conversation-sidebar`: 定义模型侧边栏如何展示打开中 webview 的历史会话、选中状态和点击切换行为。

### Modified Capabilities

- `webview-adapter-injection`: 将 provider 回传的会话列表和当前会话事件从“可诊断/后续消费”升级为 renderer 必须消费并映射到会话侧边栏状态的行为。

## Impact

- 影响 `AIList.vue` 的模型列表渲染结构，需要支持模型节点和会话子节点。
- 需要新增或扩展 Pinia store 保存每个打开模型的会话列表和当前会话。
- 影响 `WebViewContainer.vue` 的 `drainBrowserInvokeEvents()`，需要消费会话相关 `CallBridge.invoke` 事件。
- 影响 webview 事件分发逻辑，需要从侧边栏向目标 webview 分发 `conversationClicked`。
- 需要验证并更新 `online/zhipu_chatglm/inject.js` 的历史列表接口捕获、当前会话识别和历史点击切换逻辑。
- 需要新增单元测试/组件测试和 Electron e2e 覆盖历史列表同步、侧边栏点击切换、页面内切换同步和关闭 tab 清理。
