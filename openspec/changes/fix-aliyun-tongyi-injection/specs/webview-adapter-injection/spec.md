# webview-adapter-injection Delta Specification

## ADDED Requirements

### Requirement: Sidebar State Handler Return Value
Provider adapter 的 `onSidebarVisibleChanged(visible)` 处理函数 SHALL 返回布尔值表示侧边栏状态是否成功同步到目标状态。

#### Scenario: 侧边栏已处于目标状态
- **WHEN** `onSidebarVisibleChanged(true)` 被调用
- **AND** 侧边栏当前已经可见
- **THEN** 函数返回 `true`
- **AND** 不执行额外的点击操作

#### Scenario: 侧边栏需要切换状态
- **WHEN** `onSidebarVisibleChanged(false)` 被调用
- **AND** 侧边栏当前可见
- **THEN** 函数点击侧边栏切换按钮
- **AND** 函数返回 `true` 表示操作成功

#### Scenario: 侧边栏切换按钮不存在
- **WHEN** `onSidebarVisibleChanged` 被调用
- **AND** 无法找到侧边栏或切换按钮
- **THEN** 函数返回 `false`

#### Scenario: 禁止返回 undefined
- **WHEN** `onSidebarVisibleChanged` 执行完成
- **THEN** 函数不得返回 `undefined`
- **AND** 函数必须返回 `true` 或 `false`

### Requirement: Conversation Click Navigation
Provider adapter 的 `onConversationClicked(conversationId, conversationTitle)` 处理函数 SHALL 正确点击目标历史会话元素以触发页面导航。

#### Scenario: 侧边栏已折叠时先展开
- **WHEN** `onConversationClicked` 被调用
- **AND** 侧边栏当前处于折叠状态
- **THEN** 函数先调用 `onSidebarVisibleChanged(true)` 展开侧边栏
- **AND** 函数等待侧边栏展开完成（至少 300ms）
- **AND** 函数再执行会话点击操作

#### Scenario: 通过标题匹配查找会话
- **WHEN** `onConversationClicked(conversationId, conversationTitle)` 被调用
- **THEN** 函数在历史会话列表中查找文本内容匹配 `conversationTitle` 的元素
- **AND** 函数点击该会话的可交互容器

#### Scenario: 点击后触发导航
- **WHEN** 函数点击目标会话元素
- **THEN** 页面应导航到该会话的聊天内容
- **AND** URL 应发生变化以反映当前会话 ID

#### Scenario: 点击失败处理
- **WHEN** 无法找到匹配的会话元素
- **THEN** 函数不应抛出未捕获异常
- **AND** 函数应记录警告日志

### Requirement: URL Change Conversation Notification
Provider adapter 的 `onUrlChanged(args)` 处理函数 SHALL 在 URL 变化时通知当前会话 ID 给客户端。

#### Scenario: URL 包含会话 ID
- **WHEN** webview URL 发生变化
- **AND** 新 URL 包含可识别的会话 ID
- **THEN** 函数调用 `invokeBrowserMethod("webConversationChanged", conversationId)`
- **AND** conversationId 从 URL 中提取

#### Scenario: URL 不包含会话 ID
- **WHEN** webview URL 发生变化
- **AND** 新 URL 不包含可识别的会话 ID
- **THEN** 函数不调用 `webConversationChanged`
- **AND** 函数继续执行其他同步操作（如侧边栏、输入框状态同步）

#### Scenario: 页面未完全加载
- **WHEN** `onUrlChanged` 被调用
- **AND** `document.readyState !== "complete"`
- **THEN** 函数可以延迟执行或直接返回
- **AND** 函数不应抛出未捕获异常

### Requirement: Provider Injection Test Coverage
系统 SHALL 为每个 provider adapter 提供 E2E 测试覆盖核心注入功能。

#### Scenario: 侧边栏切换测试
- **GIVEN** provider adapter 已注入到测试 iframe
- **WHEN** 测试调用 `CallBridge.dispatchEvent('sidebarVisibleChanged', false)`
- **THEN** 页面侧边栏被隐藏
- **AND** 测试验证 `onSidebarVisibleChanged` 返回 `true`

#### Scenario: 新建会话按钮测试
- **GIVEN** provider adapter 已注入到测试 iframe
- **WHEN** 测试调用 `CallBridge.dispatchEvent('chatNewButtonClicked')`
- **THEN** 新建会话按钮被点击
- **AND** 页面准备开始新会话

#### Scenario: 历史会话点击测试
- **GIVEN** provider adapter 已注入到测试 iframe
- **AND** 测试 iframe 包含模拟的历史会话列表
- **WHEN** 测试调用 `CallBridge.dispatchEvent('conversationClicked', 'test-id', 'Test Conversation')`
- **THEN** 侧边栏先展开（如已折叠）
- **AND** 目标会话元素被点击
- **AND** 模拟的点击事件被触发

#### Scenario: 通用侧边栏回退测试
- **GIVEN** provider adapter 已注入到测试 iframe
- **AND** 测试 iframe 包含通用侧边栏结构（非特定 provider 的 DOM）
- **WHEN** 测试调用 `CallBridge.dispatchEvent('sidebarVisibleChanged', false)`
- **THEN** 系统使用通用选择器查找侧边栏切换按钮
- **AND** 侧边栏状态被正确切换

## MODIFIED Requirements

无（本变更仅为 bug 修复，不修改现有规范要求的内容）

## REMOVED Requirements

无
