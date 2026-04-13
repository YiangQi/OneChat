## Context

OneChat 已经通过 `CallBridge` 将 renderer 和各模型网站的 provider 注入脚本连接起来。provider 可以调用 `invokeBrowserMethod("webConversationListUpdated", conversations)` 和 `invokeBrowserMethod("webConversationChanged", id)` 回传网页会话状态，但当前 `WebViewContainer.drainBrowserInvokeEvents()` 只记录日志，没有把事件写入应用状态。

侧边栏当前由 `AIList.vue` 直接渲染 `aiModelsStore.models`，结构是平铺模型列表。`tabsStore.openTab(model)` 当前对每个 `modelId` 只保留一个 tab，因此会话状态可以先按模型维度维护。webview 使用 `partition="persist:${model.id}"`，登录态和网页历史由模型网站自身保存，OneChat 只同步展示和分发切换动作。

ChatGLM 作为首个验证目标，其历史接口和 DOM 结构可能已变化，需要在实现前用已登录的 Electron profile 抓取真实接口和响应格式，并据此更新 `online/zhipu_chatglm/inject.js`。

## Goals / Non-Goals

**Goals:**

- 在侧边栏把打开中的模型展示为模型节点 + 历史会话子节点的树形结构。
- 消费 provider 回传的会话列表和当前会话事件，并同步到侧边栏 UI。
- 支持从侧边栏点击历史会话，向对应已打开 webview 分发 `conversationClicked(id, title)`，让网页切换历史记录。
- 支持网页内切换历史记录后，侧边栏选中状态同步更新。
- 关闭模型 tab 后清除该模型的历史会话列表和选中状态。
- 使用 ChatGLM 登录态实站验证接口捕获、列表同步、点击切换和选中同步。

**Non-Goals:**

- 不在模型 tab 未打开时展示历史记录。
- 不通过点击历史记录自动打开模型 tab。
- 不持久化 OneChat 自己的历史会话缓存；会话列表来自打开中的 webview。
- 不重写所有 provider 的历史同步逻辑，本变更以 ChatGLM 为验证目标，并保持通用 adapter 事件格式。
- 不改变模型网站自身的历史数据、登录态或会话存储。

## Decisions

### 1. 会话状态按 `modelId` 存储

当前同一个模型只允许一个 tab，`tabsStore.openTab(model)` 会复用已有 `modelId` tab。因此新增会话状态 store 时按 `modelId` 保存即可：

```text
conversationState[modelId] = {
  conversations,
  activeConversationId,
  loadedAt
}
```

如果未来支持同模型多 tab，再升级为按 `tabId` 保存。

替代方案是立即按 `tabId` 存储，但当前 UI 侧边栏是模型维度，且 tabs store 已限制单模型单 tab，按 tab 存储会增加不必要映射复杂度。

### 2. 历史列表只跟随打开中的 tab 存在

未打开模型 tab 时，侧边栏只显示模型节点，不显示历史子节点。打开 tab 后，provider 抓到历史接口并回传列表，才显示子节点。关闭 tab 时清理该 `modelId` 的会话列表和选中状态。

这样可以避免显示过期历史、避免侧边栏成为一个独立历史缓存系统，也符合“没有打开页面就没有历史记录”的产品约束。

### 3. 侧边栏点击不自动打开 tab

会话子节点只会在 tab 已打开时出现，因此点击历史记录时只向现有 webview 分发：

```text
CallBridge.dispatchEvent("conversationClicked", id, title)
```

如果找不到对应打开 tab 或 webview 未 ready，应记录诊断并安全失败，不自动打开新 tab。

### 4. Renderer 消费 `CallBridge.invoke` 会话事件

`WebViewContainer.drainBrowserInvokeEvents()` 负责读取 provider 回传队列。实现时应新增对事件名的消费：

- `webConversationListUpdated`: normalize 会话数组后写入 conversation store。
- `webConversationChanged`: 更新 active conversation id；允许 `null` 或空值表示未选中。

其他未知事件继续保留诊断日志。

### 5. 注入格式保持通用

provider 回传会话列表继续使用现有通用格式：

```ts
{
  id: string
  title: string
  subTitle?: string
}
```

Renderer 负责 normalize，保证 malformed item 不破坏 UI。ChatGLM 注入脚本应适配真实接口字段，但输出仍转换为上述格式。

## Risks / Trade-offs

- ChatGLM 接口变化频繁 -> 实现前使用已登录 Electron profile 抓取真实 URL、响应结构和页面切换 DOM；e2e 中用模拟响应覆盖稳定行为。
- provider 多次回传列表导致 UI 抖动 -> store 按 `modelId` 覆盖最新列表，并可在实现中按 id/title 做轻量去重。
- 页面切换历史后没有触发详情接口 -> ChatGLM adapter 需要同时监听 fetch/XHR、URL 变化或 DOM 选中态，确保能回传 `webConversationChanged`。
- 关闭 tab 后异步事件迟到 -> `WebViewContainer` 在卸载或关闭后应避免写入已清理状态；store 更新可校验 tab/model 是否仍打开。
- 不持久化历史列表会导致重新打开模型时短暂为空 -> 接受该取舍，因为列表应由当前 webview 重新同步，避免展示过期数据。
