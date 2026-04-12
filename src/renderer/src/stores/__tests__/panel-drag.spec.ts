import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePanelStore } from '../panel'
import { useTabsStore } from '../tabs'

describe('PanelStore - 拖拽边缘检测', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('handleDragOver', () => {
    let panelStore: ReturnType<typeof usePanelStore>

    beforeEach(() => {
      panelStore = usePanelStore()
    })

    it('鼠标在左边缘应该设置 position 为 left', () => {
      const mockRect = { left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => ({}) }
      const mockEvent = {
        clientX: 30,
        clientY: 400,
        preventDefault: vi.fn()
      } as unknown as DragEvent

      panelStore.handleDragOver(mockEvent, 'panel-1', mockRect)

      expect(panelStore.dragPreview.position).toBe('left')
      expect(panelStore.dragPreview.visible).toBe(true)
      expect(panelStore.dragPreview.targetPanelId).toBe('panel-1')
    })

    it('鼠标在右边缘应该设置 position 为 right', () => {
      const mockRect = { left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => ({}) }
      const mockEvent = {
        clientX: 970,
        clientY: 400,
        preventDefault: vi.fn()
      } as unknown as DragEvent

      panelStore.handleDragOver(mockEvent, 'panel-1', mockRect)

      expect(panelStore.dragPreview.position).toBe('right')
    })

    it('鼠标在上边缘应该设置 position 为 top', () => {
      const mockRect = { left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => ({}) }
      const mockEvent = {
        clientX: 500,
        clientY: 30,
        preventDefault: vi.fn()
      } as unknown as DragEvent

      panelStore.handleDragOver(mockEvent, 'panel-1', mockRect)

      expect(panelStore.dragPreview.position).toBe('top')
    })

    it('鼠标在下边缘应该设置 position 为 bottom', () => {
      const mockRect = { left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => ({}) }
      const mockEvent = {
        clientX: 500,
        clientY: 770,
        preventDefault: vi.fn()
      } as unknown as DragEvent

      panelStore.handleDragOver(mockEvent, 'panel-1', mockRect)

      expect(panelStore.dragPreview.position).toBe('bottom')
    })

    it('鼠标在中心应该设置 position 为 center', () => {
      const mockRect = { left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => ({}) }
      const mockEvent = {
        clientX: 500,
        clientY: 400,
        preventDefault: vi.fn()
      } as unknown as DragEvent

      panelStore.handleDragOver(mockEvent, 'panel-1', mockRect)

      expect(panelStore.dragPreview.position).toBe('center')
    })

    it('应该调用 preventDefault', () => {
      const mockRect = { left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => ({}) }
      const mockEvent = {
        clientX: 30,
        clientY: 400,
        preventDefault: vi.fn()
      } as unknown as DragEvent

      panelStore.handleDragOver(mockEvent, 'panel-1', mockRect)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })
  })
})

describe('PanelStore - 拖放操作', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('drop 到 left 应该创建左侧分屏', () => {
    const panelStore = usePanelStore()
    const tabsStore = useTabsStore()

    // 添加一个测试标签页到默认面板
    const defaultPanel = panelStore.findPanel('panel-default')!
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
    defaultPanel.tabs = [...tabsStore.tabs]
    defaultPanel.activeTabId = tabsStore.tabs[1].id

    const tabId = tabsStore.tabs[0].id

    panelStore.handleDrop(tabId, 'left', 'panel-default')

    // 应该创建了新的分屏
    const parentPanel = panelStore.panels.find(p => p.children)
    expect(parentPanel).toBeDefined()
    expect(parentPanel?.direction).toBe('vertical')
  })

  it('drop 到 center 应该合并到目标面板', () => {
    const panelStore = usePanelStore()
    const tabsStore = useTabsStore()

    // 先创建分屏
    panelStore.splitPanel('panel-default', 'after', 'horizontal')

    // 在第一个面板打开标签页
    const panel1 = panelStore.flatPanels[0]
    tabsStore.openTab({
      id: 'chatgpt',
      name: 'ChatGPT',
      url: 'https://chat.openai.com',
      icon: 'chatgpt.png'
    })
    panel1.tabs = [...tabsStore.tabs]
    panel1.activeTabId = tabsStore.tabs[0].id

    const tabId = tabsStore.tabs[0].id
    const targetPanelId = panelStore.flatPanels[1].id

    panelStore.handleDrop(tabId, 'center', targetPanelId)

    // 标签页应该移动到目标面板
    const targetPanel = panelStore.findPanel(targetPanelId)
    expect(targetPanel?.tabs.some(t => t.id === tabId)).toBe(true)
  })

  it('drop 后应该隐藏预览', () => {
    const panelStore = usePanelStore()
    const tabsStore = useTabsStore()

    // 添加一个测试标签页到默认面板
    const defaultPanel = panelStore.findPanel('panel-default')!
    tabsStore.openTab({
      id: 'chatgpt',
      name: 'ChatGPT',
      url: 'https://chat.openai.com',
      icon: 'chatgpt.png'
    })
    defaultPanel.tabs = [...tabsStore.tabs]
    defaultPanel.activeTabId = tabsStore.tabs[0].id

    // 先显示预览
    panelStore.dragPreview = {
      visible: true,
      position: 'left',
      targetPanelId: 'panel-1'
    }

    const tabId = tabsStore.tabs[0].id
    panelStore.handleDrop(tabId, 'left', 'panel-default')

    expect(panelStore.dragPreview.visible).toBe(false)
    expect(panelStore.dragPreview.position).toBeNull()
  })
})
