# OneChat VS Code 风格布局系统设计文档

**日期：** 2026-04-11
**状态：** 已批准
**作者：** Joe
**项目：** OneChat

---

## 1. 概述

本文档描述了 OneChat 应用的 VS Code 风格布局系统设计，包括标签切换、分栏、拖拽、多窗口管理等功能。

### 1.1 目标

- 修复标签切换功能
- 实现 VS Code 级别的分栏系统
- 支持拖拽标签到不同面板
- 支持拖出标签创建独立窗口
- 支持窗口合并（拖回主窗口）
- 提供完整的 Playwright E2E 测试覆盖

### 1.2 技术选型

| 技术 | 用途 |
|------|------|
| Golden Layout | 布局管理库 |
| Pinia | 状态管理 |
| Electron IPC | 多窗口通信 |
| Vue 3 | 前端框架 |
| Playwright | E2E 测试 |

---

## 2. 架构设计

### 2.1 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        App.vue                               │
│  ┌──────────┐ ┌─────────┐ ┌─────────────────────────────┐  │
│  │Activity  │ │Sidebar  │ │    LayoutContainer (新增)     │  │
│  │  Bar     │ │         │ │  ┌───────────────────────┐  │  │
│  └──────────┘ └─────────┘  │ │   Golden Layout       │  │  │
│                          │ │  ┌─────┬─────┬─────┐  │  │  │
│                          │ │  │Pane1│Pane2│Pane3│  │  │  │
│                          │ │  └─────┴─────┴─────┘  │  │  │
│                          │ └───────────────────────┘  │  │
│                          └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 组件结构

```
src/renderer/src/components/
├── LayoutContainer.vue      (新增) Golden Layout 容器
│   ├── 初始化 GL 实例
│   ├── 管理布局配置
│   └── 处理拖放事件
│
├── TabContainer.vue          (修改) 简化为单面板标签栏
│   ├── 移除布局管理逻辑
│   ├── 只负责显示标签列表
│   └── 响应标签点击/关闭
│
└── WebViewContainer.vue      (保持不变)
```

### 2.3 布局层级结构

```
Root (Golden Layout Container)
├── Row/Column (可嵌套的分割容器)
│   ├── Stack (标签栈容器)
│   │   ├── ContentItem (WebViewContainer)
│   │   ├── ContentItem
│   │   └── Header (可拖拽的标签栏)
│   └── Stack
│       └── ContentItem
```

---

## 3. 核心功能

### 3.1 标签切换（第一阶段）

**问题：** TabContainer.vue 调用 `tabsStore.activateTab(tab.id)` 但该方法不存在

**解决方案：**
```typescript
// src/renderer/src/stores/tabs.ts
function activateTab(id: string) {
  activeTabId.value = id
}
```

### 3.2 分栏系统

- ✅ 水平/垂直分割
- ✅ 嵌套分割（最多 3 层）
- ✅ Splitter 拖动调整大小
- ✅ 最小/最大尺寸约束（最小 200px × 150px）

### 3.3 拖拽交互

**支持的拖拽操作：**
1. 标签拖拽到不同面板
2. 拖拽高亮反馈
3. 拖拽预览（虚线轮廓）
4. 拖出窗口创建独立窗口
5. 拖入主窗口合并
6. 窗口间互相拖拽

### 3.4 多窗口管理

- 支持创建独立窗口
- 支持窗口合并
- 空窗口自动关闭
- 窗口间状态同步

---

## 4. 视觉反馈设计

### 4.1 拖拽高亮样式

| 状态 | 边框 | 背景 | 说明 |
|------|------|------|------|
| **默认** | 透明 | 透明 | 无操作时 |
| **可放置** | `2px solid var(--accent-color)` | `rgba(var(--accent-rgb), 0.1)` | 鼠标悬停在可放置区域 |
| **放置预览** | `2px dashed var(--accent-color)` | `rgba(var(--accent-rgb), 0.05)` | 显示放置后的位置 |
| **不可放置** | `2px dashed #ff4444` | `rgba(255, 68, 68, 0.05)` | 拖到无效区域 |

### 4.2 Splitter 样式

| 状态 | 宽度 | 背景 | 光标 |
|------|------|------|------|
| **默认** | `4px` | `transparent` | `default` |
| **悬停** | `4px` | `var(--accent-color)` | `col-resize / row-resize` |
| **拖动中** | `4px` | `var(--accent-color)` | `col-resize / row-resize` |

### 4.3 CSS 变量

```css
:root {
  --highlight-border: var(--accent-color);
  --highlight-bg: rgba(var(--accent-rgb), 0.1);
  --highlight-invalid: #ff4444;
}
```

---

## 5. 数据流与状态管理

### 5.1 Store 职责划分

```
┌─────────────────┬───────────────────┬───────────────────────┐
│   tabsStore     │   layoutStore     │   paneStore (可选)    │
├─────────────────┼───────────────────┼───────────────────────┤
│ • tabs[]        │ • goldenLayout    │ • activePaneId        │
│ • activeTabId   │ • layoutConfig    │ • paneStates          │
│                 │ • splitState      │                       │
│ • openTab()     │ • initLayout()    │ • setActivePane()     │
│ • closeTab()    │ • splitPane()     │                       │
│ • activateTab() │ • moveTab()       │                       │
└─────────────────┴───────────────────┴───────────────────────┘
```

### 5.2 核心数据流

**打开新标签流程：**
```
Sidebar → tabsStore.openTab() → layoutStore.addTabToLayout() → Golden Layout
```

**拖拽标签流程：**
```
用户拖拽 → LayoutContainer 监听 → layoutStore.moveTab() → GL 重新渲染
```

### 5.3 IPC 通信设计

**主进程：**
```typescript
class WindowManager {
  async createSecondaryWindow(tabId: string): Promise<number>
  async mergeToMainWindow(tabId: string, sourceWindowId: number): Promise<void>
  async moveTabBetweenWindows(tabId: string, fromId: number, toId: number): Promise<void>
  closeWindowIfEmpty(windowId: number): void
}
```

---

## 6. 错误处理

| 场景 | 处理方式 |
|------|----------|
| **拖拽到无效位置** | 显示红色高亮，标签弹回原位置 |
| **所有标签都被关闭** | 显示空状态提示 |
| **GL 初始化失败** | 降级到简单标签模式 |
| **面板尺寸过小** | 强制最小尺寸，显示 toast |
| **webview 加载失败** | 显示错误占位符，提供重试 |

---

## 7. 性能优化

1. **Webview 懒加载**：仅当面板可见时加载
2. **拖拽优化**：使用 requestAnimationFrame 更新高亮
3. **操作防抖**：splitter 拖动使用 rAF 节流

---

## 8. 测试策略

### 8.1 测试覆盖

```
tests/e2e/
├── tabs/                    # 标签功能测试
├── split-panes/             # 分栏功能测试
├── drag-drop/               # 拖拽交互测试
├── multi-window/            # 多窗口测试
└── edge-cases/              # 边缘情况测试
```

### 8.2 覆盖率目标

| 模块 | 覆盖率目标 | 测试类型 |
|------|-----------|---------|
| 标签切换 | 100% | E2E |
| 分栏功能 | 90%+ | E2E + Integration |
| 拖拽交互 | 85%+ | E2E |
| 多窗口 | 80%+ | E2E |
| Store 逻辑 | 90%+ | Unit |

### 8.3 CI/CD

```yaml
# .github/workflows/test.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest]
```

---

## 9. 实施计划

### Phase 1: 修复标签切换（1-2 小时）
- [ ] 修复 `activateTab` 方法
- [ ] 验证标签切换

### Phase 2: Golden Layout 集成（8-12 小时）
- [ ] 安装配置 GL
- [ ] 创建 LayoutContainer
- [ ] 重构 TabContainer
- [ ] 实现基础分栏
- [ ] 实现 splitter 拖动

### Phase 3: 拖拽交互（8-12 小时）
- [ ] 标签拖拽到面板
- [ ] 拖拽高亮反馈
- [ ] 拖出窗口功能

### Phase 4: 窗口合并（4-6 小时）
- [ ] 拖入主窗口
- [ ] 窗口间拖拽
- [ ] 空窗口自动关闭

### Phase 5: 错误处理与优化（4-6 小时）
- [ ] 错误边界处理
- [ ] 性能优化
- [ ] 边缘情况处理

### Phase 6: Playwright 测试（12-16 小时）
- [ ] 标签功能测试
- [ ] 分栏功能测试
- [ ] 拖拽交互测试
- [ ] 多窗口测试
- [ ] 边缘情况测试

**总工作量：** 37-54 小时（约 5-7 个工作日）

---

## 10. 暂不实现的功能

- ⏸️ 布局持久化（保存布局配置）
- ⏸️ 双击 splitter 重置大小

---

## 附录

### A. 拖拽数据格式

```typescript
interface TabDragData {
  tabId: string
  modelId: string
  model: AIModel
  sourceWindowId: number
  sourcePaneId: string
}

const MIME_TYPE = 'application/x-onechat-tab'
```

### B. 约束条件

```typescript
const paneConstraints = {
  minWidth: 200,
  minHeight: 150,
  maxNestLevel: 3
}

const DRAG_THRESHOLD = {
  edgeDistance: 30,
  minimumOutside: 10
}
```
