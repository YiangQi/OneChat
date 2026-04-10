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
    if (!goldenLayout.value || !isInitialized.value) return

    // TODO: 实现分割逻辑
    console.log('[LayoutStore] Split tab', tabId, direction)
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
