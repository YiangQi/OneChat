import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Tab } from './tabs'
import { useTabsStore } from './tabs'

const MAX_PANELS = 6
const EDGE_THRESHOLD = 50  // 边缘检测阈值 50px

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
  panelBounds?: {
    left: number
    top: number
    right: number
    bottom: number
    width: number
    height: number
  }
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

  // 全局拖拽状态 - 用于控制 webview 的 pointer-events
  const isDraggingGlobal = ref(false)

  // Sync tabs from tabsStore to default panel
  const tabsStore = useTabsStore()
  watch(
    () => tabsStore.tabs,
    (newTabs) => {
      const defaultPanel = findPanel('panel-default')
      if (defaultPanel) {
        // Update tabs array reference (not the content)
        defaultPanel.tabs = newTabs
        // Update active tab
        defaultPanel.activeTabId = tabsStore.activeTabId
      }
    },
    { deep: true }
  )

  // Also sync on initial load
  const defaultPanel = findPanel('panel-default')
  if (defaultPanel) {
    defaultPanel.tabs = tabsStore.tabs
    defaultPanel.activeTabId = tabsStore.activeTabId
  }

  // Getters
  const flatPanels = computed(() => {
    const result: Panel[] = []

    function flatten(panelList: Panel[]) {
      for (const panel of panelList) {
        if (panel.children) {
          flatten(panel.children)
        } else if (panel.tabs.length > 0) {
          // 只添加非空面板
          result.push(panel)
        }
      }
    }

    flatten(panels.value)
    return result
  })

  // 用于内部检查的计算属性，包括空面板
  const allFlatPanels = computed(() => {
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

  function canCreateNewPanel(): boolean {
    return flatPanels.value.length < MAX_PANELS
  }

  function splitPanel(
    targetPanelId: string,
    position: 'before' | 'after',
    direction: 'horizontal' | 'vertical'
  ) {
    console.log('[splitPanel] Called with:', { targetPanelId, position, direction })

    // 检查是否可以创建新面板
    if (!canCreateNewPanel()) return

    const targetPanel = findPanel(targetPanelId)
    if (!targetPanel) return

    const parent = findParentPanel(targetPanelId)
    console.log('[splitPanel] Parent:', parent ? { id: parent.id, direction: parent.direction } : null)

    const newPanel: Panel = {
      id: `panel-${Date.now()}`,
      tabs: [],
      activeTabId: '',
      size: 50
    }

    if (parent) {
      // 目标面板已经有父级（已经是分屏状态）
      if (!parent.children) return

      // 检查父级的方向是否匹配请求的方向
      if (parent.direction !== direction) {
        // 方向不匹配，暂不支持嵌套分栏
        // TODO: 未来可以实现嵌套分栏
        return
      }

      const targetIndex = parent.children.findIndex(p => p.id === targetPanelId)
      if (position === 'before') {
        parent.children.splice(targetIndex, 0, newPanel)
      } else {
        parent.children.splice(targetIndex + 1, 0, newPanel)
      }

      // 更新 sizes - 重新平均分配空间
      const newSize = 100 / parent.children.length
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

  function handleDragOver(e: DragEvent, targetPanelId: string, rect: DOMRect) {
    e.preventDefault()

    // 获取容器的边界（整个 SplitLayoutContainer）
    const container = document.querySelector('.split-layout-container')
    if (!container) return

    const containerRect = container.getBoundingClientRect()

    // 计算目标面板在容器中的相对位置和尺寸
    const panelLeft = rect.left - containerRect.left
    const panelTop = rect.top - containerRect.top
    const panelRight = panelLeft + rect.width
    const panelBottom = panelTop + rect.height

    // 计算鼠标相对于容器的位置
    const mouseX = e.clientX - containerRect.left
    const mouseY = e.clientY - containerRect.top

    // 判断鼠标位置并设置预览
    let position: 'left' | 'right' | 'top' | 'bottom' | 'center' = 'center'

    if (mouseX < panelLeft + EDGE_THRESHOLD) {
      position = 'left'
    } else if (mouseX > panelRight - EDGE_THRESHOLD) {
      position = 'right'
    } else if (mouseY < panelTop + EDGE_THRESHOLD) {
      position = 'top'
    } else if (mouseY > panelBottom - EDGE_THRESHOLD) {
      position = 'bottom'
    } else {
      position = 'center'
    }

    dragPreview.value = {
      visible: true,
      position,
      targetPanelId,
      // 存储目标面板的位置信息，用于 CSS 定位
      panelBounds: {
        left: panelLeft,
        top: panelTop,
        right: panelRight,
        bottom: panelBottom,
        width: rect.width,
        height: rect.height
      }
    }
  }

  function moveTabToPanel(tabId: string, sourcePanelId: string, targetPanelId: string) {
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
    for (const panel of allFlatPanels.value) {
      if (panel.tabs.some(t => t.id === tabId)) {
        sourcePanelId = panel.id
        break
      }
    }

    if (!sourcePanelId) return

    // 获取分割前的面板数量
    const beforePanelCount = allFlatPanels.value.length
    let newPanelId: string | null = null

    switch (position) {
      case 'left':
        // 向左分栏 = 左右排列 = 垂直分割线
        splitPanel(targetPanelId, 'before', 'vertical')
        // 找到新创建的面板（分割后面板数量增加）
        if (allFlatPanels.value.length > beforePanelCount) {
          const newPanels = allFlatPanels.value.filter(p =>
            !p.tabs || p.tabs.length === 0
          )
          newPanelId = newPanels[0]?.id || null
        }
        if (newPanelId && sourcePanelId !== newPanelId) {
          moveTabToPanel(tabId, sourcePanelId, newPanelId)
        }
        break

      case 'right':
        // 向右分栏 = 左右排列 = 垂直分割线
        splitPanel(targetPanelId, 'after', 'vertical')
        if (allFlatPanels.value.length > beforePanelCount) {
          const newPanels = allFlatPanels.value.filter(p =>
            !p.tabs || p.tabs.length === 0
          )
          newPanelId = newPanels[0]?.id || null
        }
        if (newPanelId && sourcePanelId !== newPanelId) {
          moveTabToPanel(tabId, sourcePanelId, newPanelId)
        }
        break

      case 'top':
        // 向上分栏 = 上下排列 = 水平分割线
        splitPanel(targetPanelId, 'before', 'horizontal')
        if (allFlatPanels.value.length > beforePanelCount) {
          const newPanels = allFlatPanels.value.filter(p =>
            !p.tabs || p.tabs.length === 0
          )
          newPanelId = newPanels[0]?.id || null
        }
        if (newPanelId && sourcePanelId !== newPanelId) {
          moveTabToPanel(tabId, sourcePanelId, newPanelId)
        }
        break

      case 'bottom':
        // 向下分栏 = 上下排列 = 水平分割线
        splitPanel(targetPanelId, 'after', 'horizontal')
        if (allFlatPanels.value.length > beforePanelCount) {
          const newPanels = allFlatPanels.value.filter(p =>
            !p.tabs || p.tabs.length === 0
          )
          newPanelId = newPanels[0]?.id || null
        }
        if (newPanelId && sourcePanelId !== newPanelId) {
          moveTabToPanel(tabId, sourcePanelId, newPanelId)
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

  function closePanel(panelId: string) {
    const panel = findPanel(panelId)
    const parent = findParentPanel(panelId)

    if (panel && panel.tabs.length === 0) {
      if (parent && parent.children) {
        // 从父面板中移除
        parent.children = parent.children.filter(p => p.id !== panelId)

        // 更新父面板的 sizes 数组
        if (parent.sizes && parent.sizes.length > 0) {
          const newSize = 100 / parent.children.length
          parent.sizes = parent.children.map(() => newSize)
        }

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

  function mergePanel(parentPanel: Panel) {
    // 将父面板替换为唯一的子面板
    if (!parentPanel.children || parentPanel.children.length !== 1) return

    const onlyChild = parentPanel.children[0]

    // 找到父面板的父面板（祖父面板）
    const grandParent = findParentPanel(parentPanel.id)

    if (grandParent && grandParent.children) {
      // 父面板在另一个面板的 children 中
      const parentIndex = grandParent.children.findIndex(p => p.id === parentPanel.id)
      if (parentIndex !== -1) {
        // 替换父面板为唯一的子面板
        grandParent.children.splice(parentIndex, 1, onlyChild)

        // 更新 sizes 数组（移除父面板对应的 size，重新分配）
        if (grandParent.sizes) {
          const newSize = 100 / grandParent.children.length
          grandParent.sizes = grandParent.children.map(() => newSize)
        }
      }
    } else {
      // 父面板在根列表中
      const rootIndex = panels.value.findIndex(p => p.id === parentPanel.id)
      if (rootIndex !== -1) {
        // 移除父面板
        panels.value.splice(rootIndex, 1)

        // 添加子面板到根列表
        panels.value.push(onlyChild)
      }
    }
  }

  return {
    panels,
    dragPreview,
    isDraggingGlobal,
    flatPanels,
    findPanel,
    findParentPanel,
    splitPanel,
    canCreateNewPanel,
    handleDragOver,
    moveTabToPanel,
    handleDrop,
    closePanel,
    mergePanel
  }
})
