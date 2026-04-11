# OneChat VS Code 风格分屏布局设计

**日期:** 2026-04-11
**状态:** 已批准
**技术栈:** Vue 3 + splitpanes + 原生 Drag and Drop API + Pinia

---

## 概述

为 OneChat 应用实现 VS Code 风格的分屏布局功能，支持标签页拖拽分屏、面板合并、拖出窗口等功能。

**核心需求：**
- 拖拽标签页到边缘创建新分屏（上、下、左、右）
- 拖拽标签页到其他面板合并标签页
- 拖拽标签页到窗口外打开新窗口
- 面板关闭时自动合并
- 最小尺寸限制（200px）
- 不保存布局状态（刷新后恢复默认）

---

## 技术选型

### 方案选择：splitpanes + 自定义拖拽

| 方案 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| splitpanes + 自定义拖拽 | Vue 3 原生支持，API 简单 | 需要自己实现标签页拖拽 | ✅ 选择 |
| vue-grid-layout | Vue 3 兼容 | 设计用途不同，不支持分屏 | ❌ |
| 完全自己实现 | 完全控制 | 工作量大，维护成本高 | ❌ |
| golden-layout | 功能完整 | Vue 3 兼容性问题 | ❌ 已移除 |

---

## 架构设计

### 组件结构

```
App.vue
└── SplitLayoutContainer (新增)
    ├── SplitPane (分屏面板，使用 splitpanes)
    │   ├── TabGroup (标签页组)
    │   │   ├── TabBar (标签栏)
    │   │   └── WebViewContainer (内容区)
    │   └── DragPreviewLayer (拖拽预览层)
    └── DropZoneIndicator (拖放区域指示器)
```

### Store 职责分工

| Store | 职责 |
|-------|------|
| **tabsStore** | 标签页的 CRUD（打开、关闭、激活） |
| **panelStore** | 面板的布局结构（分屏、调整大小、拖拽预览） |

---

## 核心组件

### 1. SplitLayoutContainer.vue (根容器)

**职责：**
- 管理整个分屏布局
- 使用 splitpanes 渲染面板树
- 处理面板关闭后的自动合并

**模板结构：**
```vue
<template>
  <splitpanes>
    <pane v-for="panel in flatPanels" :key="panel.id" :size="panel.size" :min-size="20">
      <TabGroup :panel="panel" />
    </pane>
  </splitpanes>
</template>
```

---

### 2. TabGroup.vue (标签页组)

**职责：**
- 显示一个面板的标签栏和内容
- 处理标签页的拖拽启动
- 渲染 WebViewContainer

**Props:**
```typescript
{
  panel: Panel  // 当前面板数据
}
```

---

### 3. DragPreviewLayer.vue (拖拽预览层)

**职责：**
- 显示半透明的拖拽预览区域
- 根据鼠标位置动态调整预览位置

**CSS 样式：**
```css
.drag-preview {
  position: fixed;
  background: rgba(59, 130, 246, 0.2);
  border: 2px dashed #3b82f6;
  pointer-events: none;
  z-index: 1000;
}

.preview-left { left: 0; top: 0; bottom: 0; width: 50%; }
.preview-right { right: 0; top: 0; bottom: 0; width: 50%; }
.preview-top { top: 0; left: 0; right: 0; height: 50%; }
.preview-bottom { bottom: 0; left: 0; right: 0; height: 50%; }
```

---

## 数据结构

### Panel 类型定义

```typescript
// panelStore.ts
interface Panel {
  id: string
  tabs: Tab[]
  activeTabId: string
  direction?: 'horizontal' | 'vertical'  // 父面板存储分割方向
  children?: Panel[]  // 子面板
  size?: number  // 面板大小百分比
}

interface LayoutState {
  panels: Panel[]
  dragPreview: {
    visible: boolean
    position: 'left' | 'right' | 'top' | 'bottom' | 'center' | null
    targetPanelId: string | null
  }
}
```

---

## 交互流程

### 拖拽状态机

```
[空闲状态]
    ↓ 用户开始拖拽标签页
[拖拽中]
    ↓ 鼠标移动
    ├→ 靠近左边缘 (50px内) → 显示左侧预览 (position: 'left')
    ├→ 靠近右边缘 → 显示右侧预览 (position: 'right')
    ├→ 靠近上边缘 → 显示上方预览 (position: 'top')
    ├→ 靠近下边缘 → 显示下方预览 (position: 'bottom')
    ├→ 靠近其他标签页组 → 显示合并预览 (position: 'center')
    └→ 拖出窗口 → 准备打开新窗口
    ↓ 用户松手
[执行操作]
    ├→ left/right/top/bottom → 创建新分屏
    ├→ center → 合并到目标面板
    └→ outside → 打开新窗口
    ↓
[回到空闲状态]
```

---

## 核心逻辑

### 边缘检测 (handleDragOver)

```typescript
function handleDragOver(e: DragEvent, targetPanelId: string) {
  const rect = getPanelRect(targetPanelId)
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const edgeThreshold = 50  // 边缘检测阈值 50px

  if (x < edgeThreshold) {
    dragPreview.value = { visible: true, position: 'left', targetPanelId }
  } else if (x > rect.width - edgeThreshold) {
    dragPreview.value = { visible: true, position: 'right', targetPanelId }
  } else if (y < edgeThreshold) {
    dragPreview.value = { visible: true, position: 'top', targetPanelId }
  } else if (y > rect.height - edgeThreshold) {
    dragPreview.value = { visible: true, position: 'bottom', targetPanelId }
  } else {
    dragPreview.value = { visible: true, position: 'center', targetPanelId }
  }
}
```

### 创建分屏 (splitPanel)

```typescript
function splitPanel(
  targetPanelId: string,
  position: 'before' | 'after',
  direction: 'horizontal' | 'vertical'
) {
  const targetPanel = findPanel(targetPanelId)
  const parent = findParentPanel(targetPanelId)

  const newPanel: Panel = {
    id: `panel-${Date.now()}`,
    tabs: [],
    activeTabId: '',
    size: 50
  }

  if (parent) {
    parent.children?.push(newPanel)
  } else {
    const newParent: Panel = {
      id: `panel-parent-${Date.now()}`,
      direction,
      children: [newPanel, targetPanel],
      sizes: [50, 50]
    }
    panels.value.push(newParent)
  }
}
```

### 面板自动合并

```typescript
function closePanel(panelId: string) {
  const panel = findPanel(panelId)
  const parent = findParentPanel(panelId)

  if (panel && panel.tabs.length === 0) {
    if (parent && parent.children) {
      parent.children = parent.children.filter(p => p.id !== panelId)

      // 如果父面板只剩一个子面板，合并
      if (parent.children.length === 1) {
        mergePanel(parent)
      }
    }
  }
}
```

---

## 边界处理

### 1. 最小尺寸限制
- 面板最小宽度/高度：200px (约 20%)
- splitpanes 配置 `:min-size="20"`

### 2. 面板数量限制
- 最大面板数：6 个
- `canCreateNewPanel()` 方法检查

### 3. 空面板处理
- 最后一个标签页关闭时，面板自动关闭
- 父面板只剩一个子面板时自动合并

---

## 测试策略

### 单元测试覆盖

| 测试文件 | 测试内容 |
|---------|---------|
| `panel.spec.ts` | 面板创建、分割、合并、查找 |
| `panel-drag.spec.ts` | 拖拽边缘检测、drop 操作 |
| `panel-merge.spec.ts` | 面板自动合并逻辑 |
| `SplitLayoutContainer.spec.ts` | 组件渲染、状态同步 |
| `TabGroup.spec.ts` | 标签页显示、拖拽属性 |

### E2E 测试覆盖

| 测试阶段 | 测试内容 |
|---------|---------|
| **第一阶段** | 默认面板、按钮分屏、调整大小、最小尺寸 |
| **第二阶段** | 拖拽到边缘、拖拽合并、预览显示 |
| **第三阶段** | 面板自动合并、拖出窗口、多级分屏 |

---

## 实施阶段

### 第一阶段：基础分屏
1. 安装 splitpanes
2. 创建 panelStore
3. 实现 SplitLayoutContainer 组件
4. 实现基础的水平/垂直分屏（按钮触发）

### 第二阶段：拖拽功能
1. 实现标签页拖拽
2. 添加拖拽预览层
3. 处理边缘检测
4. 实现拖放操作

### 第三阶段：完善功能
1. 面板自动合并
2. 最小尺寸限制
3. 拖出窗口打开新窗口
4. 添加测试

---

## 性能考虑

1. **WebView 优化**: 只有激活的标签才渲染 WebView
2. **拖拽节流**: 使用 debounce 减少计算频率 (约 60fps)
3. **懒加载**: 按需加载面板内容

---

## 验收标准

- ✅ 拖拽标签页到边缘创建新分屏（四个方向）
- ✅ 拖拽标签页到其他面板合并
- ✅ 拖拽标签页到窗口外打开新窗口
- ✅ 面板关闭时自动合并
- ✅ 面板有最小尺寸限制
- ✅ 单元测试覆盖率 > 80%
- ✅ E2E 测试全部通过
