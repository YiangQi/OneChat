## MODIFIED Requirements

### Requirement: Browser Method Invocation
系统 SHALL 支持 provider adapter 通过 `invokeBrowserMethod` / `CallBridge.invoke` 回传页面状态，并将已定义的会话事件消费到 renderer 状态。

#### Scenario: 回传加载完成
- **WHEN** provider 调用 `invokeBrowserMethod("webLoadEnded")`
- **THEN** `CallBridge.invoke` 接收该事件
- **AND** 系统不会抛出未捕获异常

#### Scenario: 回传会话列表
- **WHEN** provider 调用 `invokeBrowserMethod("webConversationListUpdated", conversations)`
- **AND** `conversations` 是会话数组
- **THEN** `CallBridge.invoke` 接收事件名称和参数
- **AND** renderer SHALL 将会话列表同步到对应模型的会话侧边栏状态

#### Scenario: 回传当前会话
- **WHEN** provider 调用 `invokeBrowserMethod("webConversationChanged", id)`
- **THEN** `CallBridge.invoke` 接收事件名称和参数
- **AND** renderer SHALL 将对应模型的当前选中会话更新为该 id

#### Scenario: 回传格式异常
- **WHEN** provider 回传的会话事件参数格式无效
- **THEN** 系统 SHALL 记录可诊断信息
- **AND** 系统 SHALL NOT 抛出未捕获异常
- **AND** 其他 webview 的注入事件消费 SHALL 不受影响
