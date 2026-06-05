import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTabsStore } from '@/stores/tabs'
import { useAIModelsStore } from '@/stores/aiModels'
import * as fixtures from '../../fixtures/ai-models'

describe('Open Tab Flow Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should complete full open tab flow', async () => {
    // 1. 加载 AI 模型
    vi.mocked(window.electronAPI.readOnlineConfig).mockResolvedValue({
      models: fixtures.mockAIModels,
      onlineDir: '/online'
    })

    const aiModelsStore = useAIModelsStore()
    await aiModelsStore.loadModels()
    expect(aiModelsStore.models).toHaveLength(3)

    // 2. 打开第一个标签
    const tabsStore = useTabsStore()
    tabsStore.openTab(fixtures.mockAIModels[0])

    // 3. 验证标签已创建
    expect(tabsStore.tabs).toHaveLength(1)
    expect(tabsStore.activeTabId).not.toBe('')
    expect(tabsStore.tabs[0].modelId).toBe(fixtures.mockAIModels[0].id)
    expect(tabsStore.isFirstOpen).toBe(false)

    // 4. 点击同一模型，不应创建新标签
    tabsStore.openTab(fixtures.mockAIModels[0])
    expect(tabsStore.tabs).toHaveLength(1)

    // 5. 打开不同模型，应创建新标签
    tabsStore.openTab(fixtures.mockAIModels[1])
    expect(tabsStore.tabs).toHaveLength(2)
    expect(tabsStore.tabs[1].modelId).toBe(fixtures.mockAIModels[1].id)
  })

  it('should handle tab close and reset', () => {
    const tabsStore = useTabsStore()

    tabsStore.openTab(fixtures.mockAIModels[0])
    tabsStore.openTab(fixtures.mockAIModels[1])

    const tab1Id = tabsStore.tabs[0].id
    const tab2Id = tabsStore.tabs[1].id

    expect(tabsStore.tabs).toHaveLength(2)
    expect(tabsStore.isFirstOpen).toBe(false)

    // 关闭第一个标签
    tabsStore.closeTab(tab1Id)
    expect(tabsStore.tabs).toHaveLength(1)
    expect(tabsStore.activeTabId).toBe(tab2Id)

    // 关闭最后一个标签
    tabsStore.closeTab(tab2Id)
    expect(tabsStore.tabs).toHaveLength(0)
    expect(tabsStore.activeTabId).toBe('')
  })

  it('should maintain tab order when closing middle tab', () => {
    const tabsStore = useTabsStore()

    tabsStore.openTab(fixtures.mockAIModels[0])
    tabsStore.openTab(fixtures.mockAIModels[1])
    tabsStore.openTab(fixtures.mockAIModels[2])

    const tab1Id = tabsStore.tabs[0].id
    const tab2Id = tabsStore.tabs[1].id
    const tab3Id = tabsStore.tabs[2].id

    expect(tabsStore.tabs).toHaveLength(3)

    // 关闭中间的标签
    tabsStore.closeTab(tab2Id)

    expect(tabsStore.tabs).toHaveLength(2)
    expect(tabsStore.tabs[0].id).toBe(tab1Id)
    expect(tabsStore.tabs[1].id).toBe(tab3Id)
  })

  it('should handle switching between existing tabs', () => {
    const tabsStore = useTabsStore()

    tabsStore.openTab(fixtures.mockAIModels[0])

    // 等待至少 1 毫秒确保 Date.now() 不同
    const start = Date.now()
    while (Date.now() - start < 2) {
      // empty loop
    }

    tabsStore.openTab(fixtures.mockAIModels[1])

    const tab1Id = tabsStore.tabs[0].id
    const tab2Id = tabsStore.tabs[1].id

    // 当前激活的应该是第二个标签（最后打开的）
    expect(tabsStore.activeTabId).toBe(tab2Id)
    expect(tab1Id).not.toBe(tab2Id)

    // 重新打开第一个标签应该切换到它
    tabsStore.openTab(fixtures.mockAIModels[0])
    expect(tabsStore.activeTabId).toBe(tab1Id)
    expect(tabsStore.tabs).toHaveLength(2) // 不会创建新标签
  })
})
