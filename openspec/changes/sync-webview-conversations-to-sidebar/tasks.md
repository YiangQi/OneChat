## 1. ChatGLM 实站接口确认

- [ ] 1.1 使用默认 Electron `userData` 登录态启�?ChatGLM webview，抓取历史列表接�?URL、请求方式和响应结构�?- [ ] 1.2 抓取 ChatGLM 页面内点击历史记录后�?URL/API/DOM 变化，确认当前会�?id 的可靠来源�?- [ ] 1.3 记录 ChatGLM 历史会话 DOM 选择器，用于 `onConversationClicked(id, title)` 的页面内切换�?
## 2. 会话状态模�?
- [x] 2.1 新增会话类型定义，包�?`id`、`title`、`subTitle` 和可选元数据�?- [x] 2.2 新增 Pinia 会话 store，按 `modelId` 保存会话列表、当前选中会话和更新时间�?- [x] 2.3 实现会话列表 normalize �?malformed item 过滤，保�?provider 异常数据不会破坏 UI�?- [x] 2.4 实现 `setConversations`、`setActiveConversation`、`clearModel` �?store action�?
## 3. Webview 回传事件消费

- [x] 3.1 �?`WebViewContainer.drainBrowserInvokeEvents()` 中消�?`webConversationListUpdated` 并写入会�?store�?- [x] 3.2 �?`WebViewContainer.drainBrowserInvokeEvents()` 中消�?`webConversationChanged` 并更新当前选中会话�?- [x] 3.3 对无效事件参数记录诊断日志并安全忽略�?- [x] 3.4 �?webview 卸载�?tab 关闭路径上清理对应模型的会话状态�?
## 4. 侧边栏树�?UI

- [x] 4.1 �?`AIList.vue` 从平铺模型列表扩展为模型节点 + 已打开模型会话子节点�?- [x] 4.2 仅当模型 tab 已打开且会话列表非空时展示历史会话子节点�?- [x] 4.3 为当前选中的历史会话添加可见选中态�?- [x] 4.4 保持点击模型节点仍然打开或激活模�?tab 的现有行为�?
## 5. 侧边栏到 Webview 的切换分�?
- [x] 5.1 在侧边栏历史会话点击时查找对应已打开模型 tab �?webview�?- [x] 5.2 向对�?webview 分发 `conversationClicked(id, title)`，不自动打开模型 tab�?- [x] 5.3 webview 不存在或�?ready 时记录诊断并安全失败�?
## 6. ChatGLM 注入脚本更新

- [x] 6.1 根据实站接口更新 ChatGLM 历史列表 hook，输出通用 `webConversationListUpdated` 格式�?- [x] 6.2 根据实站页面/API 更新 ChatGLM 当前会话识别，输�?`webConversationChanged(id)`�?- [x] 6.3 更新 ChatGLM `onConversationClicked(id, title)`，确保侧边栏点击能够切换网页历史记录�?- [x] 6.4 保留现有输入同步、侧边栏显示隐藏、新建对话功能不回退�?
## 7. 测试验证

- [x] 7.1 为会�?store 增加单元测试，覆盖列表写入、选中、清理和异常数据过滤�?- [x] 7.2 �?`AIList.vue` 增加组件测试，覆盖树形渲染、选中态和关闭 tab 后子节点消失�?- [x] 7.3 �?webview invoke 消费增加测试，覆�?`webConversationListUpdated` �?`webConversationChanged`�?- [ ] 7.4 扩展 ChatGLM e2e，覆盖注入脚本解析历史列表、切换会话和回传当前会话�?- [ ] 7.5 增加 Electron e2e，覆盖打开 ChatGLM 后侧边栏显示历史、点击历史分�?`conversationClicked`、页面内切换后侧边栏选中变化、关�?tab 后历史清除�?- [x] 7.6 运行 `npm run build` 和相关测试，确认现有底部输入框、侧边栏显示隐藏、新建对话测试仍通过�?