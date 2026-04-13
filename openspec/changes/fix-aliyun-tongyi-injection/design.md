## Context

当前 Aliyun Tongyi 注入脚本 (`online/aliyun_tongyi/inject.js`) 存在三个 bug，与已完善的 ChatGLM 注入脚本相比存在功能差距：

1. **侧边栏同步 bug**: `onSidebarVisibleChanged(visible)` 在侧边栏已处于目标状态时返回 `undefined` 而非 `true`，导致 `onLoadEnded` 中的定时器无法正常清除，`webLoadEnded` 永远不会被调用
2. **历史会话点击 bug**: `onConversationClicked` 中的 `.closest('div')` 调用是冗余的，可能导致点击错误的 DOM 元素
3. **URL 变化监听缺失**: `onUrlChanged` 没有实现当前会话 ID 通知，当用户在网页内导航时，OneChat 侧边栏无法同步选中状态

此外，项目缺少 Aliyun Tongyi 的 E2E 测试，而 ChatGLM 已有完整的测试覆盖 (`tests/e2e/chatglm-injection.spec.ts`)。

## Goals / Non-Goals

**Goals:**
- 修复 `onSidebarVisibleChanged` 返回值问题，确保状态同步正确
- 修复 `onConversationClicked` 的 DOM 点击逻辑
- 添加 `_getCurrentConversationIdFromUrl` 函数并在 `onUrlChanged` 中调用
- 创建 E2E 测试文件，覆盖核心注入功能
- 与 ChatGLM 测试模式保持一致，便于维护

**Non-Goals:**
- 重构整个注入脚本架构（仅修复 bug）
- 添加新功能（如文件上传、主题切换等已存在功能无需修改）
- 修改其他 provider 的注入脚本

## Decisions

### 1. 侧边栏状态返回值修复

**问题代码**:
```javascript
if (visible) {
    const closeSpan = document.querySelector('span[data-icon-type="qwpcicon-sidebarLeft"]');
    if(closeSpan) {
        return;  // ❌ 返回 undefined
    }
    // ...
}
```

**修复方案**: 将 `return;` 改为 `return true;`

**理由**: 当侧边栏已可见时，函数应返回 `true` 表示状态已匹配，这是 `onLoadEnded` 定时器判断条件之一。返回 `undefined` 会导致条件判断失败。

### 2. 历史会话点击逻辑优化

**问题代码**:
```javascript
divList[i].querySelector('button').closest('div').click();
```

**修复方案**: 直接点击容器 div，移除冗余的 `.querySelector('button').closest('div')`

**理由**:
- `divList[i]` 本身就是包含历史会话项的容器 div
- `.closest('div')` 返回元素自身（如果已经是 div），因此是冗余的
- 应该直接点击 `divList[i]` 或其内部的可点击元素

### 3. URL 变化监听实现

**新增函数** (参考 ChatGLM 实现):
```javascript
function _getCurrentConversationIdFromUrl() {
    // Aliyun Tongyi URL 格式待确认
    // 可能的格式: https://tongyi.aliyun.com/chat/[sessionId]
    const match = location.href.match(/(?:chat|session)[=/]([^/?#&]+)/i);
    return match ? decodeURIComponent(match[1]) : '';
}
```

**修改 `onUrlChanged`**: 在函数开头添加会话 ID 通知
```javascript
function onUrlChanged(args) {
    const currentId = _getCurrentConversationIdFromUrl();
    if (currentId) {
        invokeBrowserMethod("webConversationChanged", currentId);
    }
    // ... 现有的侧边栏/输入框同步逻辑
}
```

**理由**: 与 ChatGLM 实现保持一致，确保侧边栏选中状态与网页实际导航状态同步。

### 4. E2E 测试结构

**测试文件**: `tests/e2e/aliyun-tongyi-injection.spec.ts`

**测试用例** (参考 ChatGLM 模式):
1. **侧边栏切换测试**: 验证通过工具栏事件切换侧边栏可见性
2. **新建会话测试**: 验证点击新建会话按钮（侧边栏和顶部栏两种位置）
3. **历史会话点击测试**: 验证先展开侧边栏再点击历史会话的完整流程
4. **通用回退测试**: 验证非 Tongyi 页面的通用侧边栏处理

**理由**:
- 复用 `runInInjectedFrame` 辅助函数，减少代码重复
- 与现有测试模式保持一致，降低维护成本
- 覆盖核心用户交互路径

### 5. DOM 选择器假设

**Aliyun Tongyi DOM 结构** (基于现有代码推断):
```html
<!-- 侧边栏切换图标 -->
<span data-icon-type="qwpcicon-sidebarLeft">  <!-- 侧边栏打开时显示 -->
<span data-icon-type="qwpcicon-sidebarRight"> <!-- 侧边栏关闭时显示 -->

<!-- 新建会话图标 -->
<span data-icon-type="qwpcicon-newDialogueMedium"> <!-- 侧边栏内 -->
<span data-icon-type="qwpcicon-newDialogue">       <!-- 顶部栏 -->

<!-- 历史会话列表 -->
<div class="...sider-scrollbar">
    <div>
        <button>会话标题</button>
    </div>
</div>
```

**风险**: 如果 Aliyun 更新 DOM 结构，选择器可能失效。这是注入脚本的固有风险，需要通过测试尽早发现。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| Aliyun Tongyi 页面 DOM 结构变化导致选择器失效 | E2E 测试可以快速发现此类问题 |
| URL 格式假设不正确，无法提取会话 ID | 需要实际测试验证，可能需要调整正则表达式 |
| 点击历史会话后导航时机问题 (500ms 延迟可能不足) | 保留现有延迟值，如问题再暴露可调整 |
| 修复可能引入新的回归问题 | E2E 测试覆盖修复场景 |

## Open Questions

1. **Aliyun Tongyi URL 格式**: 需要确认实际的 URL 格式以正确提取会话 ID。假设格式为 `https://tongyi.aliyun.com/chat/[sessionId]`，但需要验证。

2. **历史会话点击目标**: 当前代码点击 `.querySelector('button').closest('div')`，但实际应该点击什么元素才能触发导航？需要确认 DOM 结构。

3. **fetch 拦截时机**: fetch 拦截器中克隆 response 的时机是否正确？是否存在 response stream 被消费的风险？

**建议**: 在实现时通过实际测试验证这些假设，必要时调整代码逻辑。
