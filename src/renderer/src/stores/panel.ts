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
