# webview-adapter-injection Specification

## Purpose
TBD - created by archiving change add-webview-adapter-injection. Update Purpose after archive.
## Requirements
### Requirement: Webview CallBridge
系统 SHALL 在每个已加载的 webview 页面上下文中提供 `CallBridge`，用于注册事件监听、分发客户端事件和回传页面事件。

#### Scenario: 创建事件桥
- **WHEN** webview 页面进入可注入状态
- **THEN** 页面上下文中存在 `CallBridge.addEventListener`
- **AND** 页面上下文中存在 `CallBridge.dispatchEvent`
- **AND** 页面上下文中存在 `CallBridge.invoke`

#### Scenario: 分发已注册事件
- **WHEN** provider handler 已通过 `CallBridge.addEventListener("inputTextChanged", handler)` 注册
- **AND** renderer 调用 `CallBridge.dispatchEvent("inputTextChanged", "hello")`
- **THEN** 页面上下文中的 handler 收到 `"hello"`

### Requirement: Provider And Common Script Injection
系统 SHALL 为每个 webview 注入模型配置中的 provider 脚本和 `online/common_inject.js`。

#### Scenario: 按模型注入 provider 脚本
- **WHEN** webview 对应模型配置包含 `script`
- **THEN** 系统注入该 `script` 指向的 provider 脚本

#### Scenario: 注入公共脚本
- **WHEN** provider 脚本注入完成
- **THEN** 系统注入 `online/common_inject.js`

#### Scenario: 缺失 provider 脚本
- **WHEN** 模型配置没有 `script` 或脚本加载失败
- **THEN** 系统记录可诊断警告
- **AND** webview 继续保持可用

### Requirement: Injection Order
系统 SHALL 按 `CallBridge`、provider 脚本、common 脚本的顺序注入。

#### Scenario: Common 脚本能注册 provider handler
- **WHEN** provider 脚本定义了 `onInputTextChanged`
- **AND** common 脚本执行
- **THEN** common 脚本通过 `CallBridge.addEventListener("inputTextChanged", onInputTextChanged)` 注册 handler

#### Scenario: Bridge 先于 common 脚本存在
- **WHEN** common 脚本执行
- **THEN** `CallBridge.addEventListener` 已经可调用

### Requirement: Safe Re-Injection
系统 SHALL 防止同一页面上下文内重复注入 provider/common 脚本造成重复 hook 或重复事件注册。

#### Scenario: 重复触发加载事件
- **WHEN** 同一 webview 页面上下文多次触发注入流程
- **THEN** provider 脚本不会在同一上下文内重复执行
- **AND** common 脚本不会在同一上下文内重复注册相同事件

#### Scenario: 页面刷新后重新注入
- **WHEN** webview 完整刷新并创建新的页面上下文
- **THEN** 系统重新建立 `CallBridge`
- **AND** 系统重新注入 provider 脚本和 common 脚本

### Requirement: Composer Event Dispatch
系统 SHALL 通过 `CallBridge.dispatchEvent` 将 BottomComposer 动作分发到目标 webview。

#### Scenario: 分发文本变化
- **WHEN** BottomComposer 文本变化
- **THEN** 系统向目标 webview 调用 `CallBridge.dispatchEvent("inputTextChanged", text)`

#### Scenario: 分发发送动作
- **WHEN** 用户点击发送
- **THEN** 系统向目标 webview 调用 `CallBridge.dispatchEvent("inputTextChanged", text)`
- **AND** 系统向目标 webview 调用 `CallBridge.dispatchEvent("inputTextSended")`

#### Scenario: 分发工具栏动作
- **WHEN** 用户点击网页侧边栏、网页输入框、登录、新建对话、添加图片或添加文件按钮
- **THEN** 系统向目标 webview 分发对应的 `CallBridge` 事件

### Requirement: Load And Navigation Sync
系统 SHALL 在注入完成、页面加载完成和站内导航后向 provider adapter 同步当前客户端状态。

#### Scenario: 加载完成同步
- **WHEN** webview 注入成功并完成加载
- **THEN** 系统分发 `loadEnded` 事件
- **AND** 事件参数包含网页输入框可见性、网页侧边栏可见性、主题、语言、深度思考和联网搜索状态

#### Scenario: 站内导航同步
- **WHEN** webview 发生站内导航或 URL 变化
- **THEN** 系统分发 `urlChanged` 事件
- **AND** 事件参数包含当前客户端状态

### Requirement: Browser Method Invocation
系统 SHALL 支持 provider adapter 通过 `invokeBrowserMethod` / `CallBridge.invoke` 回传页面状态。

#### Scenario: 回传加载完成
- **WHEN** provider 调用 `invokeBrowserMethod("webLoadEnded")`
- **THEN** `CallBridge.invoke` 接收该事件
- **AND** 系统不会抛出未捕获异常

#### Scenario: 回传会话状态
- **WHEN** provider 调用 `invokeBrowserMethod("webConversationListUpdated", conversations)` 或 `invokeBrowserMethod("webConversationChanged", id)`
- **THEN** `CallBridge.invoke` 接收事件名称和参数
- **AND** 事件可被 renderer 诊断或后续消费

### Requirement: Safe Failure Behavior
系统 SHALL 在脚本异常、事件未注册或 webview 未 ready 时安全失败。

#### Scenario: 事件未注册
- **WHEN** renderer 分发某个 provider 未实现的事件
- **THEN** 系统不会抛出未捕获异常
- **AND** 其他目标 webview 的事件分发不受影响

#### Scenario: 注入脚本异常
- **WHEN** provider 脚本或 common 脚本执行异常
- **THEN** 系统记录错误
- **AND** webview 继续保持可浏览

