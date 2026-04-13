## ADDED Requirements

### Requirement: 模型会话树展示
系统 SHALL 在侧边栏中为已打开且已同步会话列表的模型展示历史会话子节点。

#### Scenario: 打开模型后展示同步到的历史会话
- **WHEN** 用户已打开某个模型 tab
- **AND** 该模型的 provider 回传 `webConversationListUpdated`，其中包含一个或多个会话
- **THEN** 侧边栏 SHALL 在该模型节点下展示这些会话子节点
- **AND** 每个会话子节点 SHALL 展示会话标题

#### Scenario: 未打开模型不展示历史会话
- **WHEN** 某个模型没有打开中的 tab
- **THEN** 侧边栏 SHALL 只展示该模型节点
- **AND** 侧边栏 SHALL NOT 展示该模型的历史会话子节点

#### Scenario: 空历史列表
- **WHEN** 已打开模型的 provider 回传空的 `webConversationListUpdated` 列表
- **THEN** 侧边栏 SHALL 保留该模型节点
- **AND** 侧边栏 SHALL 不展示该模型的历史会话子节点

### Requirement: 会话选中状态同步
系统 SHALL 根据 webview provider 回传的当前会话事件更新侧边栏选中状态。

#### Scenario: 页面内切换会话后选中侧边栏会话
- **WHEN** provider 回传 `webConversationChanged`，参数为某个会话 id
- **AND** 该会话 id 存在于对应模型的已同步历史列表中
- **THEN** 侧边栏 SHALL 将该会话子节点标记为选中

#### Scenario: 当前会话为空
- **WHEN** provider 回传 `webConversationChanged`，参数为空值
- **THEN** 侧边栏 SHALL 清除该模型的历史会话选中状态

#### Scenario: 未知会话 id
- **WHEN** provider 回传 `webConversationChanged`，参数为不在当前历史列表中的会话 id
- **THEN** 系统 SHALL 记录可诊断信息
- **AND** 侧边栏 SHALL NOT 崩溃

### Requirement: 侧边栏点击切换网页会话
系统 SHALL 在用户点击侧边栏历史会话时，向对应已打开 webview 分发会话点击事件。

#### Scenario: 点击历史会话切换网页
- **WHEN** 用户点击某个模型节点下的历史会话子节点
- **AND** 该模型存在打开中的 tab 和 ready 的 webview
- **THEN** 系统 SHALL 向该 webview 分发 `conversationClicked`
- **AND** 分发参数 SHALL 包含会话 id 和会话标题

#### Scenario: 点击历史会话不自动打开模型
- **WHEN** 某个模型没有打开中的 tab
- **THEN** 侧边栏 SHALL NOT 展示该模型的历史会话子节点
- **AND** 系统 SHALL NOT 因历史会话点击而自动打开该模型 tab

#### Scenario: webview 不可用时安全失败
- **WHEN** 用户点击历史会话子节点
- **AND** 对应模型的 webview 不存在或尚未 ready
- **THEN** 系统 SHALL 记录可诊断信息
- **AND** 系统 SHALL NOT 抛出未捕获异常

### Requirement: 关闭 tab 清理会话状态
系统 SHALL 在模型 tab 关闭后清除该模型的历史会话列表和选中状态。

#### Scenario: 关闭模型 tab 后移除历史会话子节点
- **WHEN** 用户关闭某个模型 tab
- **THEN** 系统 SHALL 清除该模型的历史会话列表
- **AND** 系统 SHALL 清除该模型的当前选中会话
- **AND** 侧边栏 SHALL 不再展示该模型的历史会话子节点
