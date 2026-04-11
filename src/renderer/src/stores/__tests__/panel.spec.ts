import { setActivePinia, createPinia } from 'pinia'
import { usePanelStore } from '../panel'

describe('PanelStore - 初始状态', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('应该有一个默认面板', () => {
    const panelStore = usePanelStore()

    expect(panelStore.panels).toHaveLength(1)
    expect(panelStore.panels[0].id).toBe('panel-default')
    expect(panelStore.panels[0].tabs).toEqual([])
  })

  it('初始拖拽预览应该是隐藏的', () => {
    const panelStore = usePanelStore()

    expect(panelStore.dragPreview.visible).toBe(false)
    expect(panelStore.dragPreview.position).toBeNull()
  })
})

describe('PanelStore - splitPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('应该将面板分成左右两个（水平分屏）', () => {
    const panelStore = usePanelStore()
    const defaultPanelId = panelStore.panels[0].id

    panelStore.splitPanel(defaultPanelId, 'after', 'horizontal')

    // 应该创建一个父面板包含两个子面板
    const parentPanel = panelStore.panels.find(p => p.children)
    expect(parentPanel).toBeDefined()
    expect(parentPanel?.direction).toBe('horizontal')
    expect(parentPanel?.children).toHaveLength(2)
  })

  it('新面板应该各占 50%', () => {
    const panelStore = usePanelStore()
    const defaultPanelId = panelStore.panels[0].id

    panelStore.splitPanel(defaultPanelId, 'after', 'horizontal')

    const parentPanel = panelStore.panels.find(p => p.children)
    expect(parentPanel?.sizes).toEqual([50, 50])
  })

  it('before 位置应该将新面板放在左边', () => {
    const panelStore = usePanelStore()
    const defaultPanelId = panelStore.panels[0].id

    panelStore.splitPanel(defaultPanelId, 'before', 'horizontal')

    const parentPanel = panelStore.panels.find(p => p.children)
    expect(parentPanel?.children?.[0].tabs).toEqual([])
    // 原面板应该在右边
    expect(parentPanel?.children?.[1].id).toBe(defaultPanelId)
  })

  it('应该支持垂直分屏', () => {
    const panelStore = usePanelStore()
    const defaultPanelId = panelStore.panels[0].id

    panelStore.splitPanel(defaultPanelId, 'after', 'vertical')

    const parentPanel = panelStore.panels.find(p => p.children)
    expect(parentPanel?.direction).toBe('vertical')
    expect(parentPanel?.children).toHaveLength(2)
  })
})
