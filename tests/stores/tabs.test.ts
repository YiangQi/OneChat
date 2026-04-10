import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTabsStore } from '@/stores/tabs'
import * as fixtures from '../fixtures/ai-models'

describe('Tabs Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should open first tab', () => {
    const store = useTabsStore()
    store.openTab(fixtures.mockAIModels[0])
    expect(store.tabs).toHaveLength(1)
    expect(store.activeTabId).not.toBe('')
    expect(store.isFirstOpen).toBe(false)
  })

  it('should not open duplicate model tab', () => {
    const store = useTabsStore()
    store.openTab(fixtures.mockAIModels[0])
    store.openTab(fixtures.mockAIModels[0])
    expect(store.tabs).toHaveLength(1)
  })

  it('should close tab and handle empty state', () => {
    const store = useTabsStore()
    store.openTab(fixtures.mockAIModels[0])
    const tabId = store.tabs[0].id
    store.closeTab(tabId)
    expect(store.tabs).toHaveLength(0)
    expect(store.activeTabId).toBe('')
    // isFirstOpen 只在第一次打开标签时设置为 false，不会重置
    expect(store.isFirstOpen).toBe(false)
  })

  it('should activate existing tab when opening same model', () => {
    const store = useTabsStore()
    store.openTab(fixtures.mockAIModels[0])
    store.openTab(fixtures.mockAIModels[1])
    const firstTabId = store.tabs[0].id
    store.openTab(fixtures.mockAIModels[0]) // 重新打开第一个
    expect(store.activeTabId).toBe(firstTabId)
  })

  it('should activate previous tab when closing active tab', () => {
    const store = useTabsStore()
    store.openTab(fixtures.mockAIModels[0])
    store.openTab(fixtures.mockAIModels[1])
    store.openTab(fixtures.mockAIModels[2])

    const activeTabId = store.activeTabId
    store.closeTab(activeTabId)

    // 应该激活前一个标签（第二个）
    expect(store.activeTabId).toBe(store.tabs[1].id)
  })

  it('should handle closing first tab correctly', () => {
    const store = useTabsStore()
    store.openTab(fixtures.mockAIModels[0])
    store.openTab(fixtures.mockAIModels[1])

    const firstTabId = store.tabs[0].id
    store.closeTab(firstTabId)

    expect(store.tabs).toHaveLength(1)
    // 应该激活第二个标签（现在是第一个）
    expect(store.activeTabId).toBe(store.tabs[0].id)
  })

  describe('activateTab', () => {
    it('should activate existing tab', () => {
      const store = useTabsStore()
      store.openTab(fixtures.mockAIModels[0])
      store.openTab(fixtures.mockAIModels[1])

      const firstTabId = store.tabs[0].id
      const secondTabId = store.tabs[1].id

      // 确保第二个标签是激活的
      expect(store.activeTabId).toBe(secondTabId)

      // 激活第一个标签
      store.activateTab(firstTabId)
      expect(store.activeTabId).toBe(firstTabId)
    })

    it('should do nothing if tab does not exist', () => {
      const store = useTabsStore()
      store.openTab(fixtures.mockAIModels[0])
      const originalActiveTabId = store.activeTabId

      store.activateTab('non-existent-id')
      expect(store.activeTabId).toBe(originalActiveTabId)
    })

    it('should handle activating already active tab', () => {
      const store = useTabsStore()
      store.openTab(fixtures.mockAIModels[0])
      const activeTabId = store.activeTabId

      store.activateTab(activeTabId)
      expect(store.activeTabId).toBe(activeTabId)
    })

    it('should work with multiple tabs', () => {
      const store = useTabsStore()
      store.openTab(fixtures.mockAIModels[0])
      store.openTab(fixtures.mockAIModels[1])
      store.openTab(fixtures.mockAIModels[2])

      const tabIds = store.tabs.map(t => t.id)

      // 激活第一个标签
      store.activateTab(tabIds[0])
      expect(store.activeTabId).toBe(tabIds[0])

      // 激活第三个标签
      store.activateTab(tabIds[2])
      expect(store.activeTabId).toBe(tabIds[2])

      // 激活第二个标签
      store.activateTab(tabIds[1])
      expect(store.activeTabId).toBe(tabIds[1])
    })
  })
})
