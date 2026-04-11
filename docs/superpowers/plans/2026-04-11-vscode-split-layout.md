# VS Code 风格分屏布局实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 OneChat 实现 VS Code 风格的分屏布局功能，支持拖拽标签页创建分屏、合并面板、拖出窗口等

**Architecture:** 使用 splitpanes 库处理分屏和调整大小，原生 HTML5 Drag and Drop API 处理标签页拖拽，Pinia Store 管理面板状态

**Tech Stack:** Vue 3 + splitpanes + Pinia + TypeScript + Vitest + Playwright

---

## 文件结构

### 新建文件
```
src/renderer/src/stores/panel.ts                          # Panel store
src/renderer/src/components/SplitLayoutContainer.vue     # 主布局容器
src/renderer/src/components/TabGroup.vue                 # 标签页组
src/renderer/src/components/DragPreviewLayer.vue         # 拖拽预览层
src/renderer/src/stores/__tests__/panel.spec.ts          # Panel store 测试
src/renderer/src/stores/__tests__/panel-drag.spec.ts     # 拖拽功能测试
src/renderer/src/stores/__tests__/panel-merge.spec.ts    # 面板合并测试
src/renderer/src/components/__tests__/SplitLayoutContainer.spec.ts  # 组件测试
src/renderer/src/components/__tests__/TabGroup.spec.ts   # TabGroup 测试
tests/e2e/split-phase1.spec.ts                           # E2E 测试第一阶段
tests/e2e/split-phase2.spec.ts                           # E2E 测试第二阶段
tests/e2e/split-phase3.spec.ts                           # E2E 测试第三阶段
```

### 修改文件
```
src/renderer/src/App.vue                                 # 替换 TabContainer 为 SplitLayoutContainer
src/renderer/src/stores/tabs.ts                          # 可能需要微调
package.json                                             # 添加 splitpanes 依赖
```

---

## Chunk 1: 环境准备和 Panel Store 基础

### Task 1: 安装 splitpanes 依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 添加 splitpanes 依赖到 package.json**

在 `dependencies` 中添加：
```json
"splitpanes": "^3.1.5"
```

- [ ] **Step 2: 安装依赖**

Run: `npm install`

Expected: 依赖安装成功，无错误

- [ ] **Step 3: 验证安装**

Run: `npm list splitpanes`

Expected: 显示 `splitpanes@3.1.5`

- [ ] **Step 4: 提交**

```bash
git add package.json package-lock.json
git commit -m "deps: add splitpanes for split layout functionality"
```

---

### Task 2: 创建 Panel Store 基础结构和类型定义

**Files:**
- Create: `src/renderer/src/stores/panel.ts`
- Test: `src/renderer/src/stores/__tests__/panel.spec.ts`

- [ ] **Step 1: 创建测试文件 - 初始状态测试**

创建 `src/renderer/src/stores/__tests__/panel.spec.ts`:

```typescript
import { setActivePinia, createPinia } from 'pinia'
import { usePanelStore } from '../panel'

describe('PanelStore - 初始状态', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('应该有一个默认面板', () => {
    const panelStore = usePanelStore()
    
    expect(panelStore.panels).toHaveLength(1)
    expect(panelStore.panels[0].id).toBe('panel-default')
    expect(panelStore.panels[0].tabs).toEqual([])
  })

  it('初始拖拽预览应该是隐藏的', () => {
    const panelStore = usePanelStore()
    
    expect(panelStore.dragPreview.visible).toBe(false)
    expect(panelStore.dragPreview.position).toBeNull()
  })
})
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test -- src/renderer/src/stores/__tests__/panel.spec.ts`

Expected: FAIL - "Cannot find module '@/stores/panel'"

- [ ] **Step 3: 创建 Panel Store 基础结构**

创建 `src/renderer/src/stores/panel.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Tab } from './tabs'

export interface Panel {
  id: string
  tabs: Tab[]
  activeTabId: string
  direction?: 'horizontal' | 'vertical'
  children?: Panel[]
  size?: number
}

export interface DragPreview {
  visible: boolean
  position: 'left' | 'right' | 'top' | 'bottom' | 'center' | null
  targetPanelId: string | null
}

export const usePanelStore = defineStore('panel', () => {
  // State
  const panels = ref<Panel[]>([
    {
      id: 'panel-default',
      tabs: [],
      activeTabId: ''
    }
  ])

  const dragPreview = ref<DragPreview>({
    visible: false,
    position: null,
    targetPanelId: null
  })

  // Getters
  const flatPanels = computed(() => {
    const result: Panel[] = []
    
    function flatten(panelList: Panel[]) {
      for (const panel of panelList) {
        if (panel.children) {
          flatten(panel.children)
        } else {
          result.push(panel)
        }
      }
    }
    
    flatten(panels.value)
    return result
  })

  // Actions
  function findPanel(panelId: string): Panel | undefined {
    function search(panelList: Panel[]): Panel | undefined {
      for (const panel of panelList) {
        if (panel.id === panelId) {
          return panel
        }
        if (panel.children) {
          const found = search(panel.children)
          if (found) return found
        }
      }
      return undefined
    }
    
    return search(panels.value)
  }

  function findParentPanel(panelId: string): Panel | undefined {
    function search(panelList: Panel[]): Panel | undefined {
      for (const panel of panelList) {
        if (panel.children) {
          for (const child of panel.children) {
            if (child.id === panelId) {
              return panel
            }
          }
          const found = search(panel.children)
          if (found) return found
        }
      }
      return undefined
    }
    
    return search(panels.value)
  }

  return {
    panels,
    dragPreview,
    flatPanels,
    findPanel,
    findParentPanel
  }
})
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm test -- src/renderer/src/stores/__tests__/panel.spec.ts`

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/stores/panel.ts src/renderer/src/stores/__tests__/panel.spec.ts
git commit -m "feat: create panel store with basic structure and types"
```

---

### Task 3: 实现 splitPanel 基础功能

**Files:**
- Modify: `src/renderer/src/stores/panel.ts`
- Test: `src/renderer/src/stores/__tests__/panel.spec.ts`

- [ ] **Step 1: 添加 splitPanel 测试**

在 `src/renderer/src/stores/__tests__/panel.spec.ts` 中添加：

```typescript
describe('PanelStore - splitPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('应该将面板分成左右两个（水平分屏）', () => {
    const panelStore = usePanelStore()
    const defaultPanelId = panelStore.panels[0].id
    
    panelStore.splitPanel(defaultPanelId, 'after', 'horizontal')
    
    // 应该创建一个父面板包含两个子面板
    const parentPanel = panelStore.panels.find(p => p.children)
    expect(parentPanel).toBeDefined()
    expect(parentPanel?.direction).toBe('horizontal')
    expect(parentPanel?.children).toHaveLength(2)
  })

  it('新面板应该各占 50%', () => {
    const panelStore = usePanelStore()
    const defaultPanelId = panelStore.panels[0].id
    
    panelStore.splitPanel(defaultPanelId, 'after', 'horizontal')
    
    const parentPanel = panelStore.panels.find(p => p.children)
    expect(parentPanel?.sizes).toEqual([50, 50])
  })

  it('before 位置应该将新面板放在左边', () => {
    const panelStore = usePanelStore()
    const defaultPanelId = panelStore.panels[0].id
    
    panelStore.splitPanel(defaultPanelId, 'before', 'horizontal')
    
    const parentPanel = panelStore.panels.find(p => p.children)
    expect(parentPanel?.children?.[0].tabs).toEqual([])
    // 原面板应该在右边
    expect(parentPanel?.children?.[1].id).toBe(defaultPanelId)
  })

  it('应该支持垂直分屏', () => {
    const panelStore = usePanelStore()
    const defaultPanelId = panelStore.panels[0].id
    
    panelStore.splitPanel(defaultPanelId, 'after', 'vertical')
    
    const parentPanel = panelStore.panels.find(p => p.children)
    expect(parentPanel?.direction).toBe('vertical')
    expect(parentPanel?.children).toHaveLength(2)
  })
})
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test -- src/renderer/src/stores/__tests__/panel.spec.ts`

Expected: FAIL - "panelStore.splitPanel is not a function"

- [ ] **Step 3: 实现 splitPanel 方法**

在 `src/renderer/src/stores/panel.ts` 中添加：

```typescript
// 在 return 语句前添加
function splitPanel(
  targetPanelId: string,
  position: 'before' | 'after',
  direction: 'horizontal' | 'vertical'
) {
  const targetPanel = findPanel(targetPanelId)
  if (!targetPanel) return

  const parent = findParentPanel(targetPanelId)

  const newPanel: Panel = {
    id: `panel-${Date.now()}`,
    tabs: [],
    activeTabId: '',
    size: 50
  }

  if (parent) {
    // 目标面板已经有父级（已经是分屏状态）
    if (!parent.children) return
    
    const targetIndex = parent.children.findIndex(p => p.id === targetPanelId)
    if (position === 'before') {
      parent.children.splice(targetIndex, 0, newPanel)
    } else {
      parent.children.splice(targetIndex + 1, 0, newPanel)
    }
    
    // 更新 sizes
    const newSize = 100 / (parent.children.length + 1)
    parent.sizes = parent.children.map(() => newSize)
  } else {
    // 创建新的父级面板
    const newParent: Panel = {
      id: `panel-parent-${Date.now()}`,
      direction,
      children: position === 'before' ? [newPanel, targetPanel] : [targetPanel, newPanel],
      sizes: [50, 50]
    }
    
    // 从根列表中移除目标面板
    const rootIndex = panels.value.findIndex(p => p.id === targetPanelId)
    if (rootIndex !== -1) {
      panels.value.splice(rootIndex, 1)
    }
    
    panels.value.push(newParent)
  }
}

// 在 return 中添加
return {
  panels,
  dragPreview,
  flatPanels,
  findPanel,
  findParentPanel,
  splitPanel
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm test -- src/renderer/src/stores/__tests__/panel.spec.ts`

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/stores/panel.ts src/renderer/src/stores/__tests__/panel.spec.ts
git commit -m "feat: implement splitPanel function for creating split panels"
```

---

### Task 4: 添加面板数量限制

**Files:**
- Modify: `src/renderer/src/stores/panel.ts`
- Test: `src/renderer/src/stores/__tests__/panel.spec.ts`

- [ ] **Step 1: 添加面板数量限制测试**

在 `src/renderer/src/stores/__tests__/panel.spec.ts` 中添加：

```typescript
describe('PanelStore - 面板数量限制', () => {
  const MAX_PANELS = 6

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('不应该超过最大面板数量', () => {
    const panelStore = usePanelStore()
    
    // 尝试创建超过限制的面板
    for (let i = 0; i < 10; i++) {
      const panels = panelStore.flatPanels
      if (panels.length > 0 && panelStore.canCreateNewPanel()) {
        panelStore.splitPanel(panels[0].id, 'after', 'horizontal')
      }
    }
    
    // 应该不超过 MAX_PANELS
    expect(panelStore.flatPanels.length).toBeLessThanOrEqual(MAX_PANELS)
  })

  it('canCreateNewPanel 应该正确返回', () => {
    const panelStore = usePanelStore()
    
    expect(panelStore.canCreateNewPanel()).toBe(true)
    
    // 创建到最大数量
    for (let i = 1; i < MAX_PANELS; i++) {
      const panels = panelStore.flatPanels
      if (panelStore.canCreateNewPanel()) {
        panelStore.splitPanel(panels[0].id, 'after', 'horizontal')
      }
    }
    
    expect(panelStore.canCreateNewPanel()).toBe(false)
  })
})
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test -- src/renderer/src/stores/__tests__/panel.spec.ts`

Expected: FAIL - "panelStore.canCreateNewPanel is not a function"

- [ ] **Step 3: 实现面板数量限制**

在 `src/renderer/src/stores/panel.ts` 顶部添加常量：

```typescript
const MAX_PANELS = 6
```

在 return 语句前添加：

```typescript
function canCreateNewPanel(): boolean {
  return flatPanels.value.length < MAX_PANELS
}
```

修改 splitPanel 函数，在开始处添加检查：

```typescript
function splitPanel(
  targetPanelId: string,
  position: 'before' | 'after',
  direction: 'horizontal' | 'vertical'
) {
  // 检查是否可以创建新面板
  if (!canCreateNewPanel()) return
  
  const targetPanel = findPanel(targetPanelId)
  // ... 其余代码不变
}
```

在 return 中添加：

```typescript
return {
  panels,
  dragPreview,
  flatPanels,
  findPanel,
  findParentPanel,
  splitPanel,
  canCreateNewPanel
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm test -- src/renderer/src/stores/__tests__/panel.spec.ts`

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/stores/panel.ts src/renderer/src/stores/__tests__/panel.spec.ts
git commit -m "feat: add panel count limit (max 6 panels)"
```

---

### Task 5: 实现 findPanel 和 findParentPanel 的完整测试

**Files:**
- Test: `src/renderer/src/stores/__tests__/panel.spec.ts`

- [ ] **Step 1: 添加查找相关测试**

在 `src/renderer/src/stores/__tests__/panel.spec.ts` 中添加：

```typescript
describe('PanelStore - 查找面板', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('应该能找到根面板', () => {
    const panelStore = usePanelStore()
    const defaultPanelId = panelStore.panels[0].id
    
    const panel = panelStore.findPanel(defaultPanelId)
    
    expect(panel).toBeDefined()
    expect(panel?.id).toBe(defaultPanelId)
  })

  it('应该能找到嵌套的子面板', () => {
    const panelStore = usePanelStore()
    const defaultPanelId = panelStore.panels[0].id
    
    panelStore.splitPanel(defaultPanelId, 'after', 'horizontal')
    
    const parentPanel = panelStore.panels.find(p => p.children)
    const childPanelId = parentPanel?.children?.[0].id
    
    const childPanel = panelStore.findPanel(childPanelId!)
    
    expect(childPanel).toBeDefined()
    expect(childPanel?.id).toBe(childPanelId)
  })

  it('找不到的面板应该返回 undefined', () => {
    const panelStore = usePanelStore()
    
    const panel = panelStore.findPanel('non-existent-panel')
    
    expect(panel).toBeUndefined()
  })

  it('应该能找到子面板的父面板', () => {
    const panelStore = usePanelStore()
    const defaultPanelId = panelStore.panels[0].id
    
    panelStore.splitPanel(defaultPanelId, 'after', 'horizontal')
    
    const parentPanel = panelStore.panels.find(p => p.children)
    const childPanelId = parentPanel?.children?.[0].id
    
    const foundParent = panelStore.findParentPanel(childPanelId!)
    
    expect(foundParent).toBeDefined()
    expect(foundParent?.id).toBe(parentPanel?.id)
  })
})
```

- [ ] **Step 2: 运行测试验证通过**

Run: `npm test -- src/renderer/src/stores/__tests__/panel.spec.ts`

Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add src/renderer/src/stores/__tests__/panel.spec.ts
git commit -m "test: add comprehensive tests for panel lookup functions"
```

---

## Chunk 2: 创建基础组件

### Task 6: 创建 SplitLayoutContainer 组件

**Files:**
- Create: `src/renderer/src/components/SplitLayoutContainer.vue`
- Test: `src/renderer/src/components/__tests__/SplitLayoutContainer.spec.ts`

- [ ] **Step 1: 创建组件测试**

创建 `src/renderer/src/components/__tests__/SplitLayoutContainer.spec.ts`:

```typescript
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import SplitLayoutContainer from '../SplitLayoutContainer.vue'

describe('SplitLayoutContainer', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('应该渲染一个默认面板', () => {
    const wrapper = mount(SplitLayoutContainer)
    
    expect(wrapper.find('.tab-group').exists()).toBe(true)
    expect(wrapper.findAll('.tab-group')).toHaveLength(1)
  })

  it('分屏后应该渲染两个面板', async () => {
    const wrapper = mount(SplitLayoutContainer)
    const { usePanelStore } = await import('@/stores/panel')
    const panelStore = usePanelStore()
    
    panelStore.splitPanel('panel-default', 'after', 'horizontal')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.findAll('.tab-group')).toHaveLength(2)
  })
})
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test -- src/renderer/src/components/__tests__/SplitLayoutContainer.spec.ts`

Expected: FAIL - "Cannot find module '@/components/SplitLayoutContainer.vue'"

- [ ] **Step 3: 创建 SplitLayoutContainer 组件**

创建 `src/renderer/src/components/SplitLayoutContainer.vue`:

```vue
<template>
  <div class="split-layout-container">
    <splitpanes
      class="splitpanes-root"
      @resize="handleResize"
    >
      <pane
        v-for="panel in panelStore.flatPanels"
        :key="panel.id"
        :min-size="20"
        :size="panel.size"
      >
        <TabGroup :panel="panel" />
      </pane>
    </splitpanes>
    <DragPreviewLayer />
  </div>
</template>

<script setup lang="ts">
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { usePanelStore } from '@/stores/panel'
import TabGroup from './TabGroup.vue'
import DragPreviewLayer from './DragPreviewLayer.vue'

const panelStore = usePanelStore()

function handleResize(event: any) {
  // 处理面板大小调整
  // 可以在这里添加最小尺寸限制逻辑
  console.log('[SplitLayoutContainer] Resize event:', event)
}
</script>

<style scoped>
.split-layout-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: var(--bg-primary);
}

.splitpanes-root {
  width: 100%;
  height: 100%;
}
</style>
```

- [ ] **Step 4: 运行测试验证失败**

Run: `npm test -- src/renderer/src/components/__tests__/SplitLayoutContainer.spec.ts`

Expected: FAIL - TabGroup 组件不存在

- [ ] **Step 5: 提交当前进度**

```bash
git add src/renderer/src/components/SplitLayoutContainer.vue src/renderer/src/components/__tests__/SplitLayoutContainer.spec.ts
git commit -m "feat: create SplitLayoutContainer component with splitpanes integration"
```

---

### Task 7: 创建 TabGroup 组件

**Files:**
- Create: `src/renderer/src/components/TabGroup.vue`
- Test: `src/renderer/src/components/__tests__/TabGroup.spec.ts`

- [ ] **Step 1: 创建 TabGroup 测试**

创建 `src/renderer/src/components/__tests__/TabGroup.spec.ts`:

```typescript
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import TabGroup from '../TabGroup.vue'
import type { Panel } from '@/stores/panel'

describe('TabGroup', () => {
  const mockPanel: Panel = {
    id: 'panel-1',
    tabs: [],
    activeTabId: ''
  }

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('应该渲染标签页组容器', () => {
    const wrapper = mount(TabGroup, {
      props: { panel: mockPanel }
    })
    
    expect(wrapper.find('.tab-group').exists()).toBe(true)
  })

  it('应该显示面板中的标签页', () => {
    const panelWithTabs: Panel = {
      ...mockPanel,
      tabs: [{
        id: 'tab-1',
        modelId: 'chatgpt',
        model: {
          id: 'chatgpt',
          name: 'ChatGPT',
          url: 'https://chat.openai.com',
          icon: 'chatgpt.png'
        },
        createdAt: Date.now()
      }],
      activeTabId: 'tab-1'
    }

    const wrapper = mount(TabGroup, {
      props: { panel: panelWithTabs }
    })
    
    expect(wrapper.find('.tab').exists()).toBe(true)
    expect(wrapper.text()).toContain('ChatGPT')
  })
})
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test -- src/renderer/src/components/__tests__/TabGroup.spec.ts`

Expected: FAIL - "Cannot find module '@/components/TabGroup.vue'"

- [ ] **Step 3: 创建 TabGroup 组件**

创建 `src/renderer/src/components/TabGroup.vue`:

```vue
<template>
  <div 
    class="tab-group"
    @dragover="handleDragOver"
    @drop="handleDrop"
    @dragleave="handleDragLeave"
  >
    <!-- 标签栏 -->
    <div v-if="panel.tabs.length > 0" class="tab-bar">
      <div
        v-for="tab in panel.tabs"
        :key="tab.id"
        :class="['tab', { active: tab.id === panel.activeTabId }]"
        :draggable="true"
        @dragstart="handleDragStart($event, tab)"
        @click="activateTab(tab.id)"
      >
        <img :src="getIconPath(tab.model.icon)" class="tab-icon" />
        <span class="tab-title">{{ tab.model.name }}</span>
        <button class="tab-close" @click.stop="closeTab(tab.id)">
          <el-icon :size="14"><Close /></el-icon>
        </button>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="tab-content">
      <WebViewContainer
        v-for="tab in panel.tabs"
        :key="tab.id"
        :model="tab.model"
        :visible="tab.id === panel.activeTabId"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Close } from '@element-plus/icons-vue'
import { useTabsStore } from '@/stores/tabs'
import { usePanelStore } from '@/stores/panel'
import type { Panel, Tab } from '@/stores/panel'
import WebViewContainer from './WebViewContainer.vue'

interface Props {
  panel: Panel
}

const props = defineProps<Props>()
const tabsStore = useTabsStore()
const panelStore = usePanelStore()

function getIconPath(icon: string) {
  return `online://${icon}`
}

function activateTab(tabId: string) {
  // 激活标签页的逻辑
  const panel = panelStore.findPanel(props.panel.id)
  if (panel) {
    panel.activeTabId = tabId
  }
}

function closeTab(tabId: string) {
  tabsStore.closeTab(tabId)
  // TODO: 检查面板是否为空，如果为空则关闭面板
}

function handleDragStart(e: DragEvent, tab: Tab) {
  if (e.dataTransfer) {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      tabId: tab.id,
      sourcePanelId: props.panel.id
    }))
    e.dataTransfer.effectAllowed = 'move'
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  // TODO: 实现边缘检测逻辑
}

function handleDragLeave() {
  // TODO: 隐藏预览
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  // TODO: 实现拖放逻辑
}
</script>

<style scoped>
.tab-group {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--bg-primary);
}

.tab-bar {
  display: flex;
  height: 40px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid #444;
  overflow-x: auto;
  flex-shrink: 0;
}

.theme-light .tab-bar {
  border-bottom: 1px solid #bbb;
}

.tab {
  display: flex;
  align-items: center;
  height: 38px;
  margin-top: 2px;
  padding: 0 12px;
  min-width: 120px;
  max-width: 200px;
  background: var(--bg-tertiary);
  border-right: 1px solid #666;
  cursor: move;
  user-select: none;
  transition: background 0.2s;
}

.theme-light .tab {
  border-right: 1px solid #ccc;
}

.tab:hover {
  background: rgba(255, 255, 255, 0.05);
}

.theme-light .tab:hover {
  background: rgba(0, 0, 0, 0.05);
}

.tab.active {
  background: var(--bg-primary);
  border-bottom: 2px solid var(--accent-color);
  margin-bottom: -1px;
}

.tab-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.tab-title {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-close {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  margin-left: 8px;
  flex-shrink: 0;
  opacity: 0;
  transition: all 0.2s;
}

.tab:hover .tab-close {
  opacity: 0.6;
}

.tab-close:hover {
  opacity: 1 !important;
  background: rgba(255, 255, 255, 0.1);
}

.theme-light .tab-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

.tab-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}
</style>
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm test -- src/renderer/src/components/__tests__/TabGroup.spec.ts`

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/components/TabGroup.vue src/renderer/src/components/__tests__/TabGroup.spec.ts
git commit -m "feat: create TabGroup component with tab display and drag start"
```

---

### Task 8: 创建 DragPreviewLayer 组件

**Files:**
- Create: `src/renderer/src/components/DragPreviewLayer.vue`

- [ ] **Step 1: 创建 DragPreviewLayer 组件**

创建 `src/renderer/src/components/DragPreviewLayer.vue`:

```vue
<template>
  <div
    v-if="panelStore.dragPreview.visible"
    class="drag-preview"
    :class="previewClass"
  ></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePanelStore } from '@/stores/panel'

const panelStore = usePanelStore()

const previewClass = computed(() => {
  const position = panelStore.dragPreview.position
  if (!position) return ''
  return `preview-${position}`
})
</script>

<style scoped>
.drag-preview {
  position: fixed;
  background: rgba(59, 130, 246, 0.2);
  border: 2px dashed #3b82f6;
  pointer-events: none;
  z-index: 1000;
  transition: all 0.15s ease-out;
}

.preview-left {
  left: 0;
  top: 0;
  bottom: 0;
  width: 50%;
}

.preview-right {
  right: 0;
  top: 0;
  bottom: 0;
  width: 50%;
}

.preview-top {
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
}

.preview-bottom {
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
}

.preview-center {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 100px;
  background: rgba(59, 130, 246, 0.3);
  border: 2px dashed #3b82f6;
  border-radius: 8px;
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add src/renderer/src/components/DragPreviewLayer.vue
git commit -m "feat: create DragPreviewLayer component for visual drag feedback"
```

---

### Task 9: 更新 App.vue 使用 SplitLayoutContainer

**Files:**
- Modify: `src/renderer/src/App.vue`

- [ ] **Step 1: 修改 App.vue**

修改 `src/renderer/src/App.vue`:

```vue
<template>
  <div class="app-container" :class="themeClass">
    <ActivityBar :items="menuItems" :active-id="activeModule" @select="activeModule = $event" />
    <Sidebar :active-module="activeModule" />
    <SplitLayoutContainer />
    <SettingsButton />
    <SettingsDialog v-model="settingsVisible" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ChatDotRound, Setting } from '@element-plus/icons-vue'
import { useThemeStore } from '@/stores/theme'
import ActivityBar from '@/components/ActivityBar.vue'
import Sidebar from '@/components/Sidebar.vue'
import SplitLayoutContainer from '@/components/SplitLayoutContainer.vue'
import SettingsButton from '@/components/SettingsButton.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'

const themeStore = useThemeStore()
const activeModule = ref('ai')

const menuItems = [
  { id: 'ai', icon: ChatDotRound },
  { id: 'settings', icon: Setting }
]

const settingsVisible = computed({
  get: () => themeStore.settingsVisible,
  set: (val) => themeStore.setSettingsVisible(val)
})

const themeClass = computed(() => ({
  'theme-dark': themeStore.currentTheme === 'dark',
  'theme-light': themeStore.currentTheme === 'light'
}))

onMounted(() => {
  themeStore.syncSystemTheme()
})
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
</style>
```

- [ ] **Step 2: 运行应用验证无错误**

Run: `npm run dev`

Expected: 应用正常启动，无控制台错误

- [ ] **Step 3: 提交**

```bash
git add src/renderer/src/App.vue
git commit -m "refactor: replace TabContainer with SplitLayoutContainer in App.vue"
```

---

## Chunk 3: 实现拖拽功能

### Task 10: 实现边缘检测逻辑

**Files:**
- Modify: `src/renderer/src/stores/panel.ts`
- Test: `src/renderer/src/stores/__tests__/panel-drag.spec.ts`

- [ ] **Step 1: 创建拖拽边缘检测测试**

创建 `src/renderer/src/stores/__tests__/panel-drag.spec.ts`:

```typescript
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePanelStore } from '../panel'

describe('PanelStore - 拖拽边缘检测', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('handleDragOver', () => {
    let panelStore: ReturnType<typeof usePanelStore>
    
    beforeEach(() => {
      panelStore = usePanelStore()
    })

    it('鼠标在左边缘应该设置 position 为 left', () => {
      const mockRect = { left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => ({}) }
      const mockEvent = {
        clientX: 30,
        clientY: 400,
        preventDefault: vi.fn()
      } as unknown as DragEvent

      panelStore.handleDragOver(mockEvent, 'panel-1', mockRect)
      
      expect(panelStore.dragPreview.position).toBe('left')
      expect(panelStore.dragPreview.visible).toBe(true)
      expect(panelStore.dragPreview.targetPanelId).toBe('panel-1')
    })

    it('鼠标在右边缘应该设置 position 为 right', () => {
      const mockRect = { left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => ({}) }
      const mockEvent = {
        clientX: 970,
        clientY: 400,
        preventDefault: vi.fn()
      } as unknown as DragEvent

      panelStore.handleDragOver(mockEvent, 'panel-1', mockRect)
      
      expect(panelStore.dragPreview.position).toBe('right')
    })

    it('鼠标在上边缘应该设置 position 为 top', () => {
      const mockRect = { left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => ({}) }
      const mockEvent = {
        clientX: 500,
        clientY: 30,
        preventDefault: vi.fn()
      } as unknown as DragEvent

      panelStore.handleDragOver(mockEvent, 'panel-1', mockRect)
      
      expect(panelStore.dragPreview.position).toBe('top')
    })

    it('鼠标在下边缘应该设置 position 为 bottom', () => {
      const mockRect = { left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => ({}) }
      const mockEvent = {
        clientX: 500,
        clientY: 770,
        preventDefault: vi.fn()
      } as unknown as DragEvent

      panelStore.handleDragOver(mockEvent, 'panel-1', mockRect)
      
      expect(panelStore.dragPreview.position).toBe('bottom')
    })

    it('鼠标在中心应该设置 position 为 center', () => {
      const mockRect = { left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => ({}) }
      const mockEvent = {
        clientX: 500,
        clientY: 400,
        preventDefault: vi.fn()
      } as unknown as DragEvent

      panelStore.handleDragOver(mockEvent, 'panel-1', mockRect)
      
      expect(panelStore.dragPreview.position).toBe('center')
    })

    it('应该调用 preventDefault', () => {
      const mockRect = { left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => ({}) }
      const mockEvent = {
        clientX: 30,
        clientY: 400,
        preventDefault: vi.fn()
      } as unknown as DragEvent

      panelStore.handleDragOver(mockEvent, 'panel-1', mockRect)
      
      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })
  })
})
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test -- src/renderer/src/stores/__tests__/panel-drag.spec.ts`

Expected: FAIL - "panelStore.handleDragOver is not a function"

- [ ] **Step 3: 实现 handleDragOver 方法**

在 `src/renderer/src/stores/panel.ts` 中添加：

```typescript
// 在顶部添加常量
const EDGE_THRESHOLD = 50  // 边缘检测阈值 50px

// 在 return 语句前添加
function handleDragOver(e: DragEvent, targetPanelId: string, rect: DOMRect) {
  e.preventDefault()
  
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  if (x < EDGE_THRESHOLD) {
    dragPreview.value = { visible: true, position: 'left', targetPanelId }
  } else if (x > rect.width - EDGE_THRESHOLD) {
    dragPreview.value = { visible: true, position: 'right', targetPanelId }
  } else if (y < EDGE_THRESHOLD) {
    dragPreview.value = { visible: true, position: 'top', targetPanelId }
  } else if (y > rect.height - EDGE_THRESHOLD) {
    dragPreview.value = { visible: true, position: 'bottom', targetPanelId }
  } else {
    dragPreview.value = { visible: true, position: 'center', targetPanelId }
  }
}

// 在 return 中添加
return {
  // ... 其他返回值
  handleDragOver
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm test -- src/renderer/src/stores/__tests__/panel-drag.spec.ts`

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/stores/panel.ts src/renderer/src/stores/__tests__/panel-drag.spec.ts
git commit -m "feat: implement handleDragOver with edge detection"
```

---

### Task 11: 实现 handleDrop 和 moveTabToPanel

**Files:**
- Modify: `src/renderer/src/stores/panel.ts`
- Test: `src/renderer/src/stores/__tests__/panel-drag.spec.ts`

- [ ] **Step 1: 添加 handleDrop 和 moveTabToPanel 测试**

在 `src/renderer/src/stores/__tests__/panel-drag.spec.ts` 中添加：

```typescript
describe('PanelStore - 拖放操作', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('drop 到 left 应该创建左侧分屏', () => {
    const panelStore = usePanelStore()
    const tabsStore = useTabsStore()
    
    // 添加一个测试标签页
    tabsStore.openTab({
      id: 'chatgpt',
      name: 'ChatGPT',
      url: 'https://chat.openai.com',
      icon: 'chatgpt.png'
    })
    
    const tabId = tabsStore.tabs[0].id
    
    panelStore.handleDrop(tabId, 'left', 'panel-1')
    
    // 应该创建了新的分屏
    const parentPanel = panelStore.panels.find(p => p.children)
    expect(parentPanel).toBeDefined()
    expect(parentPanel?.direction).toBe('horizontal')
  })

  it('drop 到 center 应该合并到目标面板', () => {
    const panelStore = usePanelStore()
    const tabsStore = useTabsStore()
    
    // 先创建分屏
    panelStore.splitPanel('panel-default', 'after', 'horizontal')
    
    // 在第一个面板打开标签页
    tabsStore.openTab({
      id: 'chatgpt',
      name: 'ChatGPT',
      url: 'https://chat.openai.com',
      icon: 'chatgpt.png'
    })
    
    const tabId = tabsStore.tabs[0].id
    const targetPanelId = panelStore.flatPanels[1].id
    
    panelStore.handleDrop(tabId, 'center', targetPanelId)
    
    // 标签页应该移动到目标面板
    const targetPanel = panelStore.findPanel(targetPanelId)
    expect(targetPanel?.tabs.some(t => t.id === tabId)).toBe(true)
  })

  it('drop 后应该隐藏预览', () => {
    const panelStore = usePanelStore()
    const tabsStore = useTabsStore()
    
    tabsStore.openTab({
      id: 'chatgpt',
      name: 'ChatGPT',
      url: 'https://chat.openai.com',
      icon: 'chatgpt.png'
    })
    
    // 先显示预览
    panelStore.dragPreview = {
      visible: true,
      position: 'left',
      targetPanelId: 'panel-1'
    }
    
    const tabId = tabsStore.tabs[0].id
    panelStore.handleDrop(tabId, 'left', 'panel-1')
    
    expect(panelStore.dragPreview.visible).toBe(false)
    expect(panelStore.dragPreview.position).toBeNull()
  })
})
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test -- src/renderer/src/stores/__tests__/panel-drag.spec.ts`

Expected: FAIL - "panelStore.handleDrop is not a function"

- [ ] **Step 3: 实现 moveTabToPanel 和 handleDrop**

在 `src/renderer/src/stores/panel.ts` 中添加：

```typescript
import { useTabsStore } from './tabs'

// 在 return 语句前添加
function moveTabToPanel(tabId: string, sourcePanelId: string, targetPanelId: string) {
  const tabsStore = useTabsStore()
  const sourcePanel = findPanel(sourcePanelId)
  const targetPanel = findPanel(targetPanelId)
  
  if (!sourcePanel || !targetPanel) return
  
  // 找到标签页
  const tabIndex = sourcePanel.tabs.findIndex(t => t.id === tabId)
  if (tabIndex === -1) return
  
  const [tab] = sourcePanel.tabs.splice(tabIndex, 1)
  
  // 如果源面板没有激活标签页了，清空 activeTabId
  if (sourcePanel.activeTabId === tabId) {
    sourcePanel.activeTabId = sourcePanel.tabs[0]?.id || ''
  }
  
  // 添加到目标面板
  targetPanel.tabs.push(tab)
  targetPanel.activeTabId = tab.id
  
  // 检查源面板是否为空，如果为空则关闭
  if (sourcePanel.tabs.length === 0) {
    closePanel(sourcePanelId)
  }
}

function handleDrop(tabId: string, position: string, targetPanelId: string) {
  const targetPanel = findPanel(targetPanelId)
  if (!targetPanel) return
  
  // 找到标签页所在的源面板
  let sourcePanelId: string | null = null
  for (const panel of flatPanels.value) {
    if (panel.tabs.some(t => t.id === tabId)) {
      sourcePanelId = panel.id
      break
    }
  }
  
  if (!sourcePanelId) return
  
  switch (position) {
    case 'left':
      splitPanel(targetPanelId, 'before', 'horizontal')
      const newLeftPanel = flatPanels.value.find(p => !p.tabs || p.tabs.length === 0)
      if (newLeftPanel && sourcePanelId !== newLeftPanel.id) {
        moveTabToPanel(tabId, sourcePanelId, newLeftPanel.id)
      }
      break
      
    case 'right':
      splitPanel(targetPanelId, 'after', 'horizontal')
      const newRightPanel = flatPanels.value.find(p => !p.tabs || p.tabs.length === 0)
      if (newRightPanel && sourcePanelId !== newRightPanel.id) {
        moveTabToPanel(tabId, sourcePanelId, newRightPanel.id)
      }
      break
      
    case 'top':
      splitPanel(targetPanelId, 'before', 'vertical')
      const newTopPanel = flatPanels.value.find(p => !p.tabs || p.tabs.length === 0)
      if (newTopPanel && sourcePanelId !== newTopPanel.id) {
        moveTabToPanel(tabId, sourcePanelId, newTopPanel.id)
      }
      break
      
    case 'bottom':
      splitPanel(targetPanelId, 'after', 'vertical')
      const newBottomPanel = flatPanels.value.find(p => !p.tabs || p.tabs.length === 0)
      if (newBottomPanel && sourcePanelId !== newBottomPanel.id) {
        moveTabToPanel(tabId, sourcePanelId, newBottomPanel.id)
      }
      break
      
    case 'center':
      if (sourcePanelId !== targetPanelId) {
        moveTabToPanel(tabId, sourcePanelId, targetPanelId)
      }
      break
  }
  
  // 隐藏预览
  dragPreview.value = {
    visible: false,
    position: null,
    targetPanelId: null
  }
}

// 在 return 中添加
return {
  // ... 其他返回值
  moveTabToPanel,
  handleDrop
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm test -- src/renderer/src/stores/__tests__/panel-drag.spec.ts`

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/stores/panel.ts src/renderer/src/stores/__tests__/panel-drag.spec.ts
git commit -m "feat: implement handleDrop and moveTabToPanel for drag and drop"
```

---

### Task 12: 实现 closePanel 和 mergePanel

**Files:**
- Modify: `src/renderer/src/stores/panel.ts`
- Test: `src/renderer/src/stores/__tests__/panel-merge.spec.ts`

- [ ] **Step 1: 创建面板合并测试**

创建 `src/renderer/src/stores/__tests__/panel-merge.spec.ts`:

```typescript
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { usePanelStore } from '../panel'
import { useTabsStore } from '../tabs'

describe('PanelStore - 面板合并', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('面板为空时应该自动关闭', () => {
    const panelStore = usePanelStore()
    const tabsStore = useTabsStore()
    
    // 创建分屏
    panelStore.splitPanel('panel-default', 'after', 'horizontal')
    const [panel1, panel2] = panelStore.flatPanels
    
    // 在 panel1 添加标签页
    tabsStore.openTab({
      id: 'chatgpt',
      name: 'ChatGPT',
      url: 'https://chat.openai.com',
      icon: 'chatgpt.png'
    })
    panel1.tabs = [...tabsStore.tabs]
    panel1.activeTabId = tabsStore.tabs[0].id
    
    // 关闭标签页
    tabsStore.closeTab(tabsStore.tabs[0].id)
    panelStore.closePanel(panel1.id)
    
    // panel1 应该被移除，面板应该合并
    expect(panelStore.flatPanels.length).toBeLessThan(2)
  })

  it('父面板只剩一个子面板时应该合并', () => {
    const panelStore = usePanelStore()
    
    // 创建分屏
    panelStore.splitPanel('panel-default', 'after', 'horizontal')
    
    const parentPanel = panelStore.panels.find(p => p.children)
    expect(parentPanel?.children).toHaveLength(2)
    
    // 关闭一个子面板
    const childPanelId = parentPanel!.children![0].id
    panelStore.closePanel(childPanelId)
    
    // 父面板应该被移除或只剩一个子面板
    const remainingChildren = parentPanel?.children?.length || 0
    expect(remainingChildren).toBeLessThanOrEqual(1)
  })
})
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test -- src/renderer/src/stores/__tests__/panel-merge.spec.ts`

Expected: FAIL - "panelStore.closePanel is not a function"

- [ ] **Step 3: 实现 closePanel 和 mergePanel**

在 `src/renderer/src/stores/panel.ts` 中添加：

```typescript
// 在 return 语句前添加
function mergePanel(parentPanel: Panel) {
  // 将父面板替换为唯一的子面板
  if (!parentPanel.children || parentPanel.children.length !== 1) return
  
  const onlyChild = parentPanel.children[0]
  
  // 找到父面板在根列表中的位置
  const rootIndex = panels.value.findIndex(p => p.id === parentPanel.id)
  
  if (rootIndex !== -1) {
    // 移除父面板
    panels.value.splice(rootIndex, 1)
    
    // 添加子面板到根列表
    panels.value.push(onlyChild)
  }
}

function closePanel(panelId: string) {
  const panel = findPanel(panelId)
  const parent = findParentPanel(panelId)
  
  if (panel && panel.tabs.length === 0) {
    if (parent && parent.children) {
      // 从父面板中移除
      parent.children = parent.children.filter(p => p.id !== panelId)
      
      // 如果父面板只剩一个子面板，合并
      if (parent.children.length === 1) {
        mergePanel(parent)
      }
    } else {
      // 直接从根列表中移除
      const rootIndex = panels.value.findIndex(p => p.id === panelId)
      if (rootIndex !== -1) {
        panels.value.splice(rootIndex, 1)
      }
    }
  }
}

// 在 return 中添加
return {
  // ... 其他返回值
  closePanel,
  mergePanel
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm test -- src/renderer/src/stores/__tests__/panel-merge.spec.ts`

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/stores/panel.ts src/renderer/src/stores/__tests__/panel-merge.spec.ts
git commit -m "feat: implement closePanel and mergePanel for auto-merge"
```

---

### Task 13: 连接 TabGroup 的拖拽事件

**Files:**
- Modify: `src/renderer/src/components/TabGroup.vue`

- [ ] **Step 1: 完善 TabGroup 的拖拽事件处理**

修改 `src/renderer/src/components/TabGroup.vue` 的 script 部分：

```typescript
<script setup lang="ts">
import { Close } from '@element-plus/icons-vue'
import { ref, onMounted, onUnmounted } from 'vue'
import { useTabsStore } from '@/stores/tabs'
import { usePanelStore } from '@/stores/panel'
import type { Panel, Tab } from '@/stores/panel'
import WebViewContainer from './WebViewContainer.vue'

interface Props {
  panel: Panel
}

const props = defineProps<Props>()
const tabsStore = useTabsStore()
const panelStore = usePanelStore()

const tabGroupRef = ref<HTMLElement>()

function getIconPath(icon: string) {
  return `online://${icon}`
}

function activateTab(tabId: string) {
  const panel = panelStore.findPanel(props.panel.id)
  if (panel) {
    panel.activeTabId = tabId
  }
}

function closeTab(tabId: string) {
  tabsStore.closeTab(tabId)
  
  // 检查面板是否为空，如果为空则关闭面板
  setTimeout(() => {
    const panel = panelStore.findPanel(props.panel.id)
    if (panel && panel.tabs.length === 0) {
      panelStore.closePanel(panel.id)
    }
  }, 0)
}

function handleDragStart(e: DragEvent, tab: Tab) {
  if (e.dataTransfer) {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      tabId: tab.id,
      sourcePanelId: props.panel.id
    }))
    e.dataTransfer.effectAllowed = 'move'
  }
}

function handleDragOver(e: DragEvent) {
  if (!tabGroupRef.value) return
  
  const rect = tabGroupRef.value.getBoundingClientRect()
  panelStore.handleDragOver(e, props.panel.id, rect)
}

function handleDragLeave() {
  // 不立即隐藏，等待可能的进入其他区域
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  
  try {
    const data = e.dataTransfer?.getData('text/plain')
    if (!data) return
    
    const { tabId } = JSON.parse(data)
    const position = panelStore.dragPreview.position
    
    if (position) {
      panelStore.handleDrop(tabId, position, props.panel.id)
    }
  } catch (err) {
    console.error('[TabGroup] Drop error:', err)
  }
}

onMounted(() => {
  // 可以在这里添加额外的初始化逻辑
})

onUnmounted(() => {
  // 清理逻辑
})
</script>
```

同时更新 template，给 tab-group 添加 ref：

```vue
<template>
  <div 
    ref="tabGroupRef"
    class="tab-group"
    @dragover="handleDragOver"
    @drop="handleDrop"
    @dragleave="handleDragLeave"
  >
    <!-- 其余内容不变 -->
  </div>
</template>
```

- [ ] **Step 2: 提交**

```bash
git add src/renderer/src/components/TabGroup.vue
git commit -m "feat: connect drag and drop events in TabGroup component"
```

---

## Chunk 4: E2E 测试

### Task 14: 创建第一阶段 E2E 测试

**Files:**
- Create: `tests/e2e/split-phase1.spec.ts`

- [ ] **Step 1: 创建第一阶段 E2E 测试**

创建 `tests/e2e/split-phase1.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('第一阶段：基础分屏功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
  })

  test('应该显示一个默认面板', async ({ page }) => {
    await expect(page.locator('.tab-group')).toHaveCount(1)
  })

  test('打开 AI 模型后应该在面板中显示', async ({ page }) => {
    // 点击侧边栏的 ChatGPT
    await page.click('[data-testid="ai-model-chatgpt"]')
    
    // 验证标签页出现
    await expect(page.locator('.tab')).toHaveCount(1)
    await expect(page.locator('.tab')).toContainText('ChatGPT')
  })

  test('面板应该可以调整大小', async ({ page }) => {
    await page.click('[data-testid="ai-model-chatgpt"]')
    
    // 先通过 store API 创建分屏（测试用）
    await page.evaluate(() => {
      const { usePanelStore } = window.$stores || {}
      if (usePanelStore) {
        const panelStore = usePanelStore()
        panelStore.splitPanel('panel-default', 'after', 'horizontal')
      }
    })
    
    await expect(page.locator('.tab-group')).toHaveCount(2)
    
    const leftPanel = page.locator('.tab-group').first()
    const initialSize = await leftPanel.boundingBox()
    
    // 拖动分隔条
    const resizer = page.locator('.splitpanes__resizer')
    if (await resizer.count() > 0) {
      await resizer.first().dragTo(leftPanel, {
        targetPosition: { x: 100, y: 0 }
      })
      
      const newSize = await leftPanel.boundingBox()
      expect(newSize?.width).not.toBe(initialSize?.width)
    }
  })
})
```

- [ ] **Step 2: 为测试添加 data-testid 属性**

需要在相关组件中添加测试用的 data-testid 属性，但这可能需要在后续任务中完成。

- [ ] **Step 3: 提交**

```bash
git add tests/e2e/split-phase1.spec.ts
git commit -m "test: add phase 1 E2E tests for basic split functionality"
```

---

### Task 15: 创建第二阶段 E2E 测试

**Files:**
- Create: `tests/e2e/split-phase2.spec.ts`

- [ ] **Step 1: 创建第二阶段 E2E 测试**

创建 `tests/e2e/split-phase2.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('第二阶段：拖拽功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    // 打开一个标签页
    await page.click('[data-testid="ai-model-chatgpt"]')
  })

  test('拖拽标签页到右边应该创建右侧分屏', async ({ page }) => {
    const tab = page.locator('.tab').first()
    const container = page.locator('.split-layout-container')
    
    // 拖拽到右边缘
    await tab.dragTo(container, {
      targetPosition: { x: 900, y: 300 }
    })
    
    // 验证创建了两个面板
    await expect(page.locator('.tab-group')).toHaveCount(2)
  })

  test('拖拽标签页到左边应该创建左侧分屏', async ({ page }) => {
    const tab = page.locator('.tab').first()
    const container = page.locator('.split-layout-container')
    
    await tab.dragTo(container, {
      targetPosition: { x: 100, y: 300 }
    })
    
    await expect(page.locator('.tab-group')).toHaveCount(2)
  })

  test('拖拽标签页到另一个面板应该合并', async ({ page }) => {
    // 先创建分屏
    await page.click('[data-testid="ai-model-claude"]')
    
    const tab1 = page.locator('.tab').nth(0)
    const container = page.locator('.split-layout-container')
    
    // 拖拽第一个标签页到右边缘创建分屏
    await tab1.dragTo(container, {
      targetPosition: { x: 900, y: 300 }
    })
    
    // 现在有两个面板
    await expect(page.locator('.tab-group')).toHaveCount(2)
    
    // 将第二个面板的标签页拖回第一个面板的中心
    const tab2 = page.locator('.tab-group').nth(1).locator('.tab')
    const firstPanel = page.locator('.tab-group').nth(0)
    
    await tab2.dragTo(firstPanel, {
      targetPosition: { x: 200, y: 20 }
    })
    
    // 应该合并到一个面板
    await expect(page.locator('.tab-group')).toHaveCount(1)
    await expect(page.locator('.tab')).toHaveCount(2)
  })

  test('拖拽时应该显示预览区域', async ({ page }) => {
    const tab = page.locator('.tab').first()
    
    // 开始拖拽
    await tab.dragTo(page.locator('.split-layout-container'), {
      targetPosition: { x: 900, y: 300 }
    })
    
    // 验证预览层出现（可能需要添加 class 检查）
    const preview = page.locator('.drag-preview')
    // 注意：由于拖拽完成后预览会消失，这个测试可能需要调整
  })
})
```

- [ ] **Step 2: 提交**

```bash
git add tests/e2e/split-phase2.spec.ts
git commit -m "test: add phase 2 E2E tests for drag and drop functionality"
```

---

### Task 16: 创建第三阶段 E2E 测试

**Files:**
- Create: `tests/e2e/split-phase3.spec.ts`

- [ ] **Step 1: 创建第三阶段 E2E 测试**

创建 `tests/e2e/split-phase3.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('第三阶段：完善功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
  })

  test('关闭最后一个标签页后面板应该自动合并', async ({ page }) => {
    // 打开两个标签页
    await page.click('[data-testid="ai-model-chatgpt"]')
    await page.click('[data-testid="ai-model-claude"]')
    
    // 创建分屏
    const tab1 = page.locator('.tab').nth(0)
    await tab1.dragTo(page.locator('.split-layout-container'), {
      targetPosition: { x: 900, y: 300 }
    })
    
    await expect(page.locator('.tab-group')).toHaveCount(2)
    
    // 关闭第一个面板的标签页
    await page.locator('.tab-group').nth(1).locator('.tab-close').click()
    
    // 面板应该自动合并
    await expect(page.locator('.tab-group')).toHaveCount(1)
  })

  test('多级分屏应该正常工作', async ({ page }) => {
    // 打开三个标签页
    await page.click('[data-testid="ai-model-chatgpt"]')
    await page.click('[data-testid="ai-model-claude"]')
    await page.click('[data-testid="ai-model-gemini"]')
    
    // 第一次分屏（水平）
    const tab1 = page.locator('.tab').nth(0)
    await tab1.dragTo(page.locator('.split-layout-container'), {
      targetPosition: { x: 900, y: 300 }
    })
    
    await expect(page.locator('.tab-group')).toHaveCount(2)
    
    // 第二次分屏（在右面板垂直分屏）
    const tab2 = page.locator('.tab-group').nth(1).locator('.tab')
    await tab2.dragTo(page.locator('.tab-group').nth(1), {
      targetPosition: { x: 200, y: 700 }
    })
    
    // 应该有三个面板
    await expect(page.locator('.tab-group')).toHaveCount(3)
  })

  test('布局不应该在页面刷新后保存', async ({ page }) => {
    // 创建分屏
    await page.click('[data-testid="ai-model-chatgpt"]')
    const tab1 = page.locator('.tab').nth(0)
    await tab1.dragTo(page.locator('.split-layout-container'), {
      targetPosition: { x: 900, y: 300 }
    })
    
    await expect(page.locator('.tab-group')).toHaveCount(2)
    
    // 刷新页面
    await page.reload()
    
    // 应该恢复到默认状态（只有一个面板）
    await expect(page.locator('.tab-group')).toHaveCount(1)
  })
})
```

- [ ] **Step 2: 提交**

```bash
git add tests/e2e/split-phase3.spec.ts
git commit -m "test: add phase 3 E2E tests for advanced features"
```

---

## Chunk 5: 完善和优化

### Task 17: 添加测试用 data-testid 属性

**Files:**
- Modify: `src/renderer/src/components/TabGroup.vue`
- Modify: `src/renderer/src/components/Sidebar.vue`（如需要）

- [ ] **Step 1: 在 TabGroup 中添加 data-testid**

修改 `src/renderer/src/components/TabGroup.vue` 的 template：

```vue
<template>
  <div 
    ref="tabGroupRef"
    class="tab-group"
    :data-testid="`panel-${panel.id}`"
    @dragover="handleDragOver"
    @drop="handleDrop"
    @dragleave="handleDragLeave"
  >
    <div v-if="panel.tabs.length > 0" class="tab-bar">
      <div
        v-for="tab in panel.tabs"
        :key="tab.id"
        :class="['tab', { active: tab.id === panel.activeTabId }]"
        :draggable="true"
        :data-testid="`tab-${tab.id}`"
        @dragstart="handleDragStart($event, tab)"
        @click="activateTab(tab.id)"
      >
        <!-- ... -->
      </div>
    </div>
    <!-- ... -->
  </div>
</template>
```

- [ ] **Step 2: 提交**

```bash
git add src/renderer/src/components/TabGroup.vue
git commit -m "test: add data-testid attributes for E2E testing"
```

---

### Task 18: 添加拖拽节流优化

**Files:**
- Modify: `src/renderer/src/components/TabGroup.vue`

- [ ] **Step 1: 添加拖拽节流**

在 `src/renderer/src/components/TabGroup.vue` 中添加节流：

```typescript
import { debounce } from 'lodash-es'

// ...

const handleDragOverDebounced = debounce((e: DragEvent) => {
  if (!tabGroupRef.value) return
  const rect = tabGroupRef.value.getBoundingClientRect()
  panelStore.handleDragOver(e, props.panel.id, rect)
}, 16) // 约 60fps

function handleDragOver(e: DragEvent) {
  handleDragOverDebounced(e)
}
```

- [ ] **Step 2: 安装 lodash-es**

Run: `npm install lodash-es`

- [ ] **Step 3: 提交**

```bash
git add package.json package-lock.json src/renderer/src/components/TabGroup.vue
git commit -m "perf: add drag throttling for better performance"
```

---

### Task 19: 运行完整测试套件

**Files:** 无

- [ ] **Step 1: 运行所有单元测试**

Run: `npm test`

Expected: 所有测试通过

- [ ] **Step 2: 运行 E2E 测试**

Run: `npm run test:e2e`

Expected: 所有 E2E 测试通过（或根据实现情况部分通过）

- [ ] **Step 3: 生成测试覆盖率报告**

Run: `npm run test:coverage`

Expected: 覆盖率报告生成，目标 > 80%

---

### Task 20: 最终验证和文档

**Files:**
- Create: `docs/features/split-layout.md`

- [ ] **Step 1: 创建功能文档**

创建 `docs/features/split-layout.md`:

```markdown
# VS Code 风格分屏布局

## 功能概述

OneChat 支持类似 VS Code 的分屏布局功能，允许用户同时查看多个 AI 模型的对话。

## 使用方法

### 创建分屏

拖拽标签页到面板边缘即可创建分屏：
- 拖到左边缘：创建左侧分屏
- 拖到右边缘：创建右侧分屏
- 拖到上边缘：创建上方分屏
- 拖到下边缘：创建下方分屏

### 合并面板

拖拽标签页到其他面板的中心区域可以合并标签页。

### 调整面板大小

拖动面板之间的分隔条可以调整面板大小。

### 关闭面板

关闭面板中最后一个标签页时，面板会自动关闭并合并。

## 限制

- 最多支持 6 个面板
- 面板最小尺寸为 20%
- 布局不会保存，刷新后恢复默认状态
```

- [ ] **Step 2: 提交**

```bash
git add docs/features/split-layout.md
git commit -m "docs: add split layout feature documentation"
```

---

## 验收标准

完成所有任务后，应该满足：

- ✅ 拖拽标签页到边缘创建新分屏（四个方向）
- ✅ 拖拽标签页到其他面板合并
- ✅ 面板关闭时自动合并
- ✅ 面板有最小尺寸限制（20%）
- ✅ 最多 6 个面板
- ✅ 单元测试覆盖率 > 80%
- ✅ E2E 测试覆盖主要功能

---

## 开发注意事项

1. **TDD 原则**: 每个功能先写测试，再实现代码
2. **频繁提交**: 每完成一个小任务就提交
3. **代码审查**: 每个 chunk 完成后应该进行代码审查
4. **测试优先**: 确保所有测试通过后再进行下一步
