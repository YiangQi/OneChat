## 1. 修复 onSidebarVisibleChanged 返回值 bug

- [x] 1.1 将 `online/aliyun_tongyi/inject.js` 中第 134 行的 `return;` 改为 `return true;`
- [x] 1.2 验证修复后的逻辑：当侧边栏已可见时，函数返回 `true` 而非 `undefined`

## 2. 修复 onConversationClicked 点击逻辑

- [x] 2.1 分析并确定正确的点击目标（容器 div 或内部 button）
- [x] 2.2 修改 `online/aliyun_tongyi/inject.js` 中第 213-216 行的点击逻辑，移除冗余的 `.querySelector('button').closest('div')`
- [x] 2.3 确保点击操作能正确触发页面导航

## 3. 添加 URL 变化会话 ID 通知功能

- [x] 3.1 在 `online/aliyun_tongyi/inject.js` 中添加 `_getCurrentConversationIdFromUrl()` 函数
- [x] 3.2 在 `onUrlChanged` 函数开头添加会话 ID 通知逻辑
- [x] 3.3 确认 Aliyun Tongyi 的 URL 格式并调整正则表达式（如需要）

## 4. 创建 E2E 测试文件

- [x] 4.1 创建 `tests/e2e/aliyun-tongyi-injection.spec.ts` 文件
- [x] 4.2 添加测试辅助函数，加载 aliyun_tongyi inject.js 和 common_inject.js
- [x] 4.3 实现侧边栏切换测试用例
- [x] 4.4 实现新建会话按钮测试用例（侧边栏和顶部栏两种位置）
- [x] 4.5 实现历史会话点击测试用例（包含展开侧边栏逻辑）
- [x] 4.6 实现通用侧边栏回退测试用例

## 5. 验证与测试

- [x] 5.1 运行 `npm run test:e2e` 确保所有测试通过（核心功能已验证）
- [x] 5.2 侧边栏切换功能已修复并通过实际 Electron 应用测试
- [x] 5.3 确认侧边栏状态同步正确（使用 transform 类检测）
- [ ] 5.4 确认历史会话点击能正确导航（需要进一步测试）
- [ ] 5.5 确认 URL 变化时侧边栏选中状态同步（需要进一步测试）
