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
    // 检查是否可以创建新面板
    if (!canCreateNewPanel()) return

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

    // 注意：不在这里调用 closePanel，让调用者决定是否需要关闭
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

    // 获取分割前的面板数量
    const beforePanelCount = flatPanels.value.length
    let newPanelId: string | null = null

    switch (position) {
      case 'left':
        splitPanel(targetPanelId, 'before', 'horizontal')
        // 找到新创建的面板（分割后面板数量增加）
        if (flatPanels.value.length > beforePanelCount) {
          const newPanels = flatPanels.value.filter(p =>
            !p.tabs || p.tabs.length === 0
          )
          newPanelId = newPanels[0]?.id || null
        }
        if (newPanelId && sourcePanelId !== newPanelId) {
          moveTabToPanel(tabId, sourcePanelId, newPanelId)
        }
        break

      case 'right':
        splitPanel(targetPanelId, 'after', 'horizontal')
        if (flatPanels.value.length > beforePanelCount) {
          const newPanels = flatPanels.value.filter(p =>
            !p.tabs || p.tabs.length === 0
          )
          newPanelId = newPanels[0]?.id || null
        }
        if (newPanelId && sourcePanelId !== newPanelId) {
          moveTabToPanel(tabId, sourcePanelId, newPanelId)
        }
        break

      case 'top':
        splitPanel(targetPanelId, 'before', 'vertical')
        if (flatPanels.value.length > beforePanelCount) {
          const newPanels = flatPanels.value.filter(p =>
            !p.tabs || p.tabs.length === 0
          )
          newPanelId = newPanels[0]?.id || null
        }
        if (newPanelId && sourcePanelId !== newPanelId) {
          moveTabToPanel(tabId, sourcePanelId, newPanelId)
        }
        break

      case 'bottom':
        splitPanel(targetPanelId, 'after', 'vertical')
        if (flatPanels.value.length > beforePanelCount) {
          const newPanels = flatPanels.value.filter(p =>
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
    // Placeholder for now - will be implemented in Task 12
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

  return {
    panels,
    dragPreview,
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
