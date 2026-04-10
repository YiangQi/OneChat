import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AIModel } from '@shared/types'
import { useLayoutStore } from './layout'

export interface Tab {
  id: string
  modelId: string
  model: AIModel
  createdAt: number
  windowId?: number
}

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<Tab[]>([])
  const activeTabId = ref<string>('')
  const isFirstOpen = ref(true)

  function openTab(model: AIModel) {
    const existingTab = tabs.value.find(t => t.modelId === model.id)
    if (existingTab) {
      activeTabId.value = existingTab.id
      return
    }

    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      modelId: model.id,
      model,
      createdAt: Date.now()
    }

    tabs.value.push(newTab)
    activeTabId.value = newTab.id
    isFirstOpen.value = false
  }

  function closeTab(id: string) {
    const index = tabs.value.findIndex(t => t.id === id)
    if (index !== -1) {
      tabs.value.splice(index, 1)
      if (activeTabId.value === id) {
        activeTabId.value = tabs.value[Math.max(0, index - 1)]?.id || ''
      }
    }
  }

  function splitTab(id: string, direction: 'horizontal' | 'vertical') {
    const layoutStore = useLayoutStore()
    // 将 horizontal/vertical 转换为 row/column
    const glDirection = direction === 'horizontal' ? 'row' : 'column'
    layoutStore.splitTab(id, glDirection)
  }

  function moveTab(tabId: string, targetWindow: number) {
    // Will be implemented with Golden Layout
  }

  function activateTab(id: string) {
    const tab = tabs.value.find(t => t.id === id)
    if (tab) {
      activeTabId.value = id
    }
  }

  return {
    tabs,
    activeTabId,
    isFirstOpen,
    openTab,
    closeTab,
    activateTab,
    splitTab,
    moveTab
  }
})
