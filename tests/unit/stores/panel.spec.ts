import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { usePanelStore } from '@/stores/panel'
import { useTabsStore } from '@/stores/tabs'

describe('PanelStore - 初始状态', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('应该有一个默认面板', () => {
    const panelStore = usePanelStore()

    expect(panelStore.rootPanel.id).toBe('panel-default')
    expect(panelStore.rootPanel.tabs).toEqual([])
  })

  it('初始拖拽预览应该是隐藏的', () => {
    const panelStore = usePanelStore()

    expect(panelStore.dragPreview.visible).toBe(false)
    expect(panelStore.dragPreview.position).toBeNull()
  })
})

describe('PanelStore - reopen after closing dragged tabs', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('keeps the last root leaf panel after its final tab is closed', async () => {
    const panelStore = usePanelStore()
    const tabsStore = useTabsStore()

    tabsStore.openTab({
      id: 'chatgpt',
      name: 'ChatGPT',
      url: 'https://chat.openai.com',
      icon: 'chatgpt.png'
    })
    tabsStore.openTab({
      id: 'claude',
      name: 'Claude',
      url: 'https://claude.ai',
      icon: 'claude.png'
    })
    await nextTick()

    const defaultPanel = panelStore.findPanel('panel-default')!
    const firstTabId = tabsStore.tabs[0].id
    const secondTabId = tabsStore.tabs[1].id
    const newPanelId = panelStore.splitPanel(defaultPanel.id, 'after', 'vertical')!

    panelStore.moveTabToPanel(firstTabId, defaultPanel.id, newPanelId)
    panelStore.closeTab(defaultPanel.id, secondTabId)
    expect(panelStore.rootPanel.id).toBe(newPanelId)

    panelStore.closeTab(newPanelId, firstTabId)
    expect(panelStore.flatPanels).toHaveLength(1)
    expect(panelStore.rootPanel.id).toBe(newPanelId)

    tabsStore.openTab({
      id: 'doubao',
      name: 'Doubao',
      url: 'https://www.doubao.com',
      icon: 'doubao.png'
    })
    await nextTick()

    const reopenedTab = tabsStore.tabs[0]
    const ownerPanel = panelStore.findPanelContainingTab(reopenedTab.id)
    expect(ownerPanel?.id).toBe(newPanelId)
    expect(ownerPanel?.activeTabId).toBe(reopenedTab.id)
  })
})

describe('PanelStore - splitPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('应该将面板分成左右两个（水平分屏）', () => {
    const panelStore = usePanelStore()
    const defaultPanelId = panelStore.rootPanel.id

    panelStore.splitPanel(defaultPanelId, 'after', 'horizontal')

    // 应该创建一个父面板包含两个子面板
    const parentPanel = panelStore.rootPanel.children ? panelStore.rootPanel : undefined
    expect(parentPanel).toBeDefined()
    expect(parentPanel?.direction).toBe('horizontal')
    expect(parentPanel?.children).toHaveLength(2)
  })

  it('新面板应该各占 50%', () => {
    const panelStore = usePanelStore()
    const defaultPanelId = panelStore.rootPanel.id

    panelStore.splitPanel(defaultPanelId, 'after', 'horizontal')

    const parentPanel = panelStore.rootPanel.children ? panelStore.rootPanel : undefined
    expect(parentPanel?.sizes).toEqual([50, 50])
  })

  it('before 位置应该将新面板放在左边', () => {
    const panelStore = usePanelStore()
    const defaultPanelId = panelStore.rootPanel.id

    panelStore.splitPanel(defaultPanelId, 'before', 'horizontal')

    const parentPanel = panelStore.rootPanel.children ? panelStore.rootPanel : undefined
    expect(parentPanel?.children?.[0].tabs).toEqual([])
    // 原面板应该在右边
    expect(parentPanel?.children?.[1].id).toBe(defaultPanelId)
  })

  it('应该支持垂直分屏', () => {
    const panelStore = usePanelStore()
    const defaultPanelId = panelStore.rootPanel.id

    panelStore.splitPanel(defaultPanelId, 'after', 'vertical')

    const parentPanel = panelStore.rootPanel.children ? panelStore.rootPanel : undefined
    expect(parentPanel?.direction).toBe('vertical')
    expect(parentPanel?.children).toHaveLength(2)
  })
})

describe('PanelStore - 面板数量限制', () => {
  const MAX_PANELS = 10

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('不应该超过最大面板数量', () => {
    const panelStore = usePanelStore()

    // 尝试创建超过限制的面板
    for (let i = 0; i < 10; i++) {
      const panels = panelStore.flatPanels
      if (panels.length > 0 && panelStore.canCreateNewPanel()) {
        panelStore.splitPanel(panels[0].id, 'after', 'horizontal')
      }
    }

    // 应该不超过 MAX_PANELS
    expect(panelStore.flatPanels.length).toBeLessThanOrEqual(MAX_PANELS)
  })

  it('canCreateNewPanel 应该正确返回', () => {
    const panelStore = usePanelStore()

    expect(panelStore.canCreateNewPanel()).toBe(true)

    // 创建到最大数量
    for (let i = 1; i < MAX_PANELS; i++) {
      const panels = panelStore.flatPanels
      if (panelStore.canCreateNewPanel()) {
        panelStore.splitPanel(panels[0].id, 'after', 'horizontal')
      }
    }

    expect(panelStore.canCreateNewPanel()).toBe(false)
  })
})

describe('PanelStore - 查找面板', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('应该能找到根面板', () => {
    const panelStore = usePanelStore()
    const defaultPanelId = panelStore.rootPanel.id

    const panel = panelStore.findPanel(defaultPanelId)

    expect(panel).toBeDefined()
    expect(panel?.id).toBe(defaultPanelId)
  })

  it('应该能找到嵌套的子面板', () => {
    const panelStore = usePanelStore()
    const defaultPanelId = panelStore.rootPanel.id

    panelStore.splitPanel(defaultPanelId, 'after', 'horizontal')

    const parentPanel = panelStore.rootPanel.children ? panelStore.rootPanel : undefined
    const childPanelId = parentPanel?.children?.[0].id

    const childPanel = panelStore.findPanel(childPanelId!)

    expect(childPanel).toBeDefined()
    expect(childPanel?.id).toBe(childPanelId)
  })

  it('找不到的面板应该返回 undefined', () => {
    const panelStore = usePanelStore()

    const panel = panelStore.findPanel('non-existent-panel')

    expect(panel).toBeUndefined()
  })

  it('应该能找到子面板的父面板', () => {
    const panelStore = usePanelStore()
    const defaultPanelId = panelStore.rootPanel.id

    panelStore.splitPanel(defaultPanelId, 'after', 'horizontal')

    const parentPanel = panelStore.rootPanel.children ? panelStore.rootPanel : undefined
    const childPanelId = parentPanel?.children?.[0].id

    const foundParent = panelStore.findParentPanel(childPanelId!)

    expect(foundParent).toBeDefined()
    expect(foundParent?.id).toBe(parentPanel?.id)
  })
})
