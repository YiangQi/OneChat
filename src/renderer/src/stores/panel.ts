import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Tab } from './tabs'

const MAX_PANELS = 6

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

  return {
    panels,
    dragPreview,
    flatPanels,
    findPanel,
    findParentPanel,
    splitPanel,
    canCreateNewPanel
  }
})
