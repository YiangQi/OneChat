import { defineStore } from 'pinia'
import { ref } from 'vue'

// 导入 Golden Layout
import { GoldenLayout } from 'golden-layout'
import type { LayoutConfig } from 'golden-layout'

export interface PaneState {
  id: string
  tabs: string[]  // tab IDs
  activeTab: string
}

export const useLayoutStore = defineStore('layout', () => {
  const goldenLayout = ref<GoldenLayout | null>(null)
  const isInitialized = ref(false)
  const containerElement = ref<HTMLElement | null>(null)
  const error = ref<string | null>(null)

  // 初始化 Golden Layout
  function initLayout(container: HTMLElement) {
    if (isInitialized.value) {
      console.warn('[LayoutStore] Already initialized')
      return
    }

    containerElement.value = container

    // Golden Layout 配置
    const config: LayoutConfig = {
      settings: {
        showPopoutIcon: false,
        showMaximiseIcon: false,
        showCloseIcon: false
      },
      content: []
    }

    // 延迟初始化，确保 DOM 已渲染
    setTimeout(() => {
      try {
        goldenLayout.value = new GoldenLayout(config, container)
        isInitialized.value = true
        error.value = null

        // 监听布局变化
        goldenLayout.value.on('stateChanged', () => {
          // 可以在这里保存布局配置
        })

        console.log('[LayoutStore] Golden Layout initialized')
      } catch (err) {
        console.error('[LayoutStore] Failed to initialize:', err)
        error.value = 'Failed to initialize layout system'
        isInitialized.value = false
      }
    }, 0)
  }

  // 销毁布局
  function destroyLayout() {
    try {
      if (goldenLayout.value) {
        goldenLayout.value.destroy()
        goldenLayout.value = null
        isInitialized.value = false
      }
    } catch (err) {
      console.error('[LayoutStore] Error destroying layout:', err)
    }
  }

  // 添加标签到布局
  function addTabToLayout(tabId: string, tabData: any) {
    if (!goldenLayout.value || !isInitialized.value) {
      console.warn('[LayoutStore] Cannot add tab: layout not initialized')
      return
    }

    try {
      const root = goldenLayout.value.root

      if (!root || !root.contentItems || root.contentItems.length === 0) {
        const config = {
          type: 'stack',
          content: [{
            type: 'component',
            componentName: 'webview-container',
            componentState: { tabId, ...tabData },
            title: tabData.model?.name || 'New Tab'
          }]
        }
        goldenLayout.value.loadLayout({ content: [config] })
      } else {
        const firstStack = findFirstStack(root)
        if (firstStack) {
          const componentConfig = {
            type: 'component',
            componentName: 'webview-container',
            componentState: { tabId, ...tabData },
            title: tabData.model?.name || 'New Tab'
          }
          firstStack.addChild(componentConfig)
        }
      }
    } catch (err) {
      console.error('[LayoutStore] Error adding tab to layout:', err)
      error.value = 'Failed to add tab to layout'
    }
  }

  // 分割面板
  function splitTab(tabId: string, direction: 'row' | 'column') {
    if (!goldenLayout.value || !isInitialized.value) {
      console.warn('[LayoutStore] Cannot split: layout not initialized')
      return
    }

    try {
      const gl = goldenLayout.value
      const root = gl.root

      if (!root || !root.contentItems || root.contentItems.length === 0) {
        console.warn('[LayoutStore] Cannot split: no content')
        return
      }

      const targetStack = findStackByTabId(root, tabId)

      if (!targetStack) {
        console.warn('[LayoutStore] Cannot split: tab not found')
        return
      }

      const parent = targetStack.parent

      if (!parent) {
        console.warn('[LayoutStore] Cannot split: no parent')
        return
      }

      const newContainerConfig = {
        type: direction,
        content: [
          { type: 'stack', content: [] },
          { type: 'stack', content: [] }
        ]
      }

      if (parent.type === direction) {
        const newStackConfig = {
          type: 'stack',
          content: [{
            type: 'component',
            componentName: 'webview-container',
            componentState: {
              tabId: `${tabId}-split`,
              title: 'New Pane'
            },
            title: 'New Pane'
          }]
        }
        parent.addChild(newStackConfig)
      } else {
        const index = parent.contentItems?.indexOf(targetStack) ?? -1

        if (index === -1) {
          console.warn('[LayoutStore] Cannot find stack index')
          return
        }

        const newContainer = gl.createContentItem(newContainerConfig, parent)
        parent.removeChild(targetStack)
        parent.addChild(newContainer, index)

        if (newContainer.contentItems && newContainer.contentItems.length > 0) {
          newContainer.contentItems[0].addChild(targetStack)
        }
      }

      console.log('[LayoutStore] Split tab', tabId, 'in direction', direction)
    } catch (err) {
      console.error('[LayoutStore] Error splitting tab:', err)
      error.value = 'Failed to split pane'
    }
  }

  // 辅助函数：根据 tabId 查找 stack
  function findStackByTabId(node: any, tabId: string): any {
    if (!node) return null

    if (node.type === 'stack') {
      // 检查这个 stack 是否包含目标 tab
      if (node.contentItems) {
        for (const item of node.contentItems) {
          if (item.componentState?.tabId === tabId) {
            return node
          }
        }
      }
    }

    if (node.contentItems && node.contentItems.length > 0) {
      for (const child of node.contentItems) {
        const result = findStackByTabId(child, tabId)
        if (result) return result
      }
    }

    return null
  }

  // 移动标签
  function moveTab(tabId: string, targetPaneId: string) {
    if (!goldenLayout.value || !isInitialized.value) return

    try {
      // TODO: 实现移动逻辑
      console.log('[LayoutStore] Move tab', tabId, 'to', targetPaneId)
    } catch (err) {
      console.error('[LayoutStore] Error moving tab:', err)
      error.value = 'Failed to move tab'
    }
  }

  // 辅助函数：查找第一个 stack
  function findFirstStack(node: any): any {
    if (!node) return null

    if (node.type === 'stack') {
      return node
    }

    if (node.contentItems && node.contentItems.length > 0) {
      for (const child of node.contentItems) {
        const result = findFirstStack(child)
        if (result) return result
      }
    }

    return null
  }

  // 获取当前布局配置
  function getLayoutConfig(): LayoutConfig | null {
    if (!goldenLayout.value || !isInitialized.value) return null
    try {
      return goldenLayout.value.toConfig()
    } catch (err) {
      console.error('[LayoutStore] Error getting layout config:', err)
      return null
    }
  }

  // 清除错误
  function clearError() {
    error.value = null
  }

  return {
    goldenLayout,
    isInitialized,
    containerElement,
    error,
    initLayout,
    destroyLayout,
    addTabToLayout,
    splitTab,
    moveTab,
    getLayoutConfig,
    clearError
  }
})
