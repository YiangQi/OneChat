import { defineStore } from 'pinia'
import { ref } from 'vue'

// 导入 Golden Layout 类型
import type { GoldenLayout, LayoutConfig } from 'golden-layout'

export interface PaneState {
  id: string
  tabs: string[]  // tab IDs
  activeTab: string
}

export const useLayoutStore = defineStore('layout', () => {
  const goldenLayout = ref<GoldenLayout | null>(null)
  const isInitialized = ref(false)
  const containerElement = ref<HTMLElement | null>(null)

  // 初始化 Golden Layout
  function initLayout(container: HTMLElement) {
    if (isInitialized.value) return

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

        // 监听布局变化
        goldenLayout.value.on('stateChanged', () => {
          // 可以在这里保存布局配置
        })

        console.log('[LayoutStore] Golden Layout initialized')
      } catch (error) {
        console.error('[LayoutStore] Failed to initialize Golden Layout:', error)
      }
    }, 0)
  }

  // 销毁布局
  function destroyLayout() {
    if (goldenLayout.value) {
      goldenLayout.value.destroy()
      goldenLayout.value = null
      isInitialized.value = false
    }
  }

  // 添加标签到布局
  function addTabToLayout(tabId: string, tabData: any) {
    if (!goldenLayout.value || !isInitialized.value) {
      console.warn('[LayoutStore] Golden Layout not initialized')
      return
    }

    // 如果根节点为空，创建一个 stack
    const root = goldenLayout.value.root
    if (!root || !root.contentItems || root.contentItems.length === 0) {
      // 创建初始 stack
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
      // 添加到现有 stack
      const firstStack = findFirstStack(root)
      if (firstStack) {
        const componentConfig = {
          type: 'component',
          componentName: 'webview-container',
          componentState: { tabId, ...tabData },
          title: tabData.model?.name || 'New Tab'
        }
        // 使用 GL API 添加组件
        firstStack.addChild(componentConfig)
      }
    }
  }

  // 分割面板
  function splitTab(tabId: string, direction: 'row' | 'column') {
    if (!goldenLayout.value || !isInitialized.value) {
      console.warn('[LayoutStore] Cannot split: layout not initialized')
      return
    }

    const gl = goldenLayout.value
    const root = gl.root

    if (!root || !root.contentItems || root.contentItems.length === 0) {
      console.warn('[LayoutStore] Cannot split: no content')
      return
    }

    // 查找包含该标签的 stack
    const targetStack = findStackByTabId(root, tabId)

    if (!targetStack) {
      console.warn('[LayoutStore] Cannot split: tab not found')
      return
    }

    // 获取父容器
    const parent = targetStack.parent

    if (!parent) {
      console.warn('[LayoutStore] Cannot split: no parent')
      return
    }

    // 创建新的行/列容器
    const newContainerConfig = {
      type: direction,
      content: [
        { type: 'stack', content: [] },
        { type: 'stack', content: [] }
      ]
    }

    // 如果父容器已经是相同方向的行/列，直接添加新的 stack
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
      // 需要创建新的方向容器
      const index = parent.contentItems?.indexOf(targetStack) ?? -1

      if (index === -1) {
        console.warn('[LayoutStore] Cannot find stack index')
        return
      }

      // 替换当前 stack 为新的方向容器
      const newContainer = gl.createContentItem(newContainerConfig, parent)

      // 移除原 stack
      parent.removeChild(targetStack)

      // 添加新容器
      parent.addChild(newContainer, index)

      // 将原 stack 添加到新容器的第一个位置
      if (newContainer.contentItems && newContainer.contentItems.length > 0) {
        newContainer.contentItems[0].addChild(targetStack)
      }
    }

    console.log('[LayoutStore] Split tab', tabId, 'in direction', direction)
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

    // TODO: 实现移动逻辑
    console.log('[LayoutStore] Move tab', tabId, 'to', targetPaneId)
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
    return goldenLayout.value.toConfig()
  }

  return {
    goldenLayout,
    isInitialized,
    containerElement,
    initLayout,
    destroyLayout,
    addTabToLayout,
    splitTab,
    moveTab,
    getLayoutConfig
  }
})
