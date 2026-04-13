## Why

当前 Aliyun Tongyi (通义千问) 的注入脚本存在三个关键 bug，导致侧边栏状态同步失败、历史会话点击无法正常跳转，且缺少对应的 E2E 测试覆盖。与 ChatGLM 注入脚本相比，Aliyun Tongyi 的实现质量较低，需要修复以确保 OneChat 应用的一致性和可靠性。

## What Changes

- 修复 `onSidebarVisibleChanged` 函数在侧边栏已可见时返回 `undefined` 而非 `true` 的 bug
- 修复 `onConversationClicked` 函数中可能点击错误 DOM 元素的问题
- 为 `onUrlChanged` 添加会话 ID 通知功能，使侧边栏选中状态与页面实际状态同步
- 新增 `tests/e2e/aliyun-tongyi-injection.spec.ts` E2E 测试文件，覆盖侧边栏切换、新建会话、历史会话点击等核心功能
- 添加 `_getCurrentConversationIdFromUrl` 函数用于从 URL 提取当前会话 ID

## Capabilities

### New Capabilities
无（本变更仅为 bug 修复和测试补充，不引入新功能）

### Modified Capabilities
- `webview-adapter-injection`: 修复 Aliyun Tongyi provider 的注入脚本实现，确保其满足侧边栏同步、历史会话切换等核心需求

## Impact

- 修改 `online/aliyun_tongyi/inject.js` - 修复三个关键 bug
- 新增 `tests/e2e/aliyun-tongyi-injection.spec.ts` - E2E 测试文件
- 与现有 ChatGLM 测试模式保持一致，便于后续维护
