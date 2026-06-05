import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePanelStore } from '@/stores/panel'
import { useTabsStore } from '@/stores/tabs'

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

    it('目标面板太小时应该显示不可分屏提示', () => {
      const mockRect = { left: 0, top: 0, width: 500, height: 800, right: 500, bottom: 800, x: 0, y: 0, toJSON: () => ({}) }
      const mockEvent = {
        clientX: 490,
        clientY: 400,
        preventDefault: vi.fn()
      } as unknown as DragEvent

      panelStore.handleDragOver(mockEvent, 'panel-1', mockRect)

      expect(panelStore.dragPreview.position).toBe('right')
      expect(panelStore.dragPreview.blocked).toBe(true)
      expect(panelStore.dragPreview.message).toBe('空间太小，无法继续分屏')
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
    const parentPanel = panelStore.rootPanel.children ? panelStore.rootPanel : undefined
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

  it('目标面板低于最小尺寸时不应该继续分屏', () => {
    const panelStore = usePanelStore()

    expect(panelStore.canSplitWithinBounds('right', {
      width: 500,
      height: 800
    })).toBe(false)

    expect(panelStore.canSplitWithinBounds('right', {
      width: 600,
      height: 800
    })).toBe(true)

    expect(panelStore.canSplitWithinBounds('bottom', {
      width: 800,
      height: 400
    })).toBe(false)

    expect(panelStore.canSplitWithinBounds('bottom', {
      width: 800,
      height: 500
    })).toBe(true)
  })

  it('container drag over 应该设置容器级右侧预览', () => {
    const panelStore = usePanelStore()
    const mockRect = { left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => ({}) }
    const mockEvent = {
      clientX: 980,
      clientY: 400,
      preventDefault: vi.fn()
    } as unknown as DragEvent

    panelStore.handleContainerDragOver(mockEvent, mockRect)

    expect(panelStore.dragPreview.targetScope).toBe('container')
    expect(panelStore.dragPreview.position).toBe('right')
    expect(panelStore.dragPreview.visible).toBe(true)
  })

  it('container edge position 应该使用统一的边缘判定', () => {
    const panelStore = usePanelStore()
    const mockRect = { left: 10, top: 20, width: 1000, height: 800 }

    expect(panelStore.getContainerEdgePosition(20, 400, mockRect)).toBe('left')
    expect(panelStore.getContainerEdgePosition(1000, 400, mockRect)).toBe('right')
    expect(panelStore.getContainerEdgePosition(500, 30, mockRect)).toBe('top')
    expect(panelStore.getContainerEdgePosition(500, 800, mockRect)).toBe('bottom')
    expect(panelStore.getContainerEdgePosition(500, 400, mockRect)).toBeNull()
  })

  it('container drop 到 right 应该创建根级右侧分屏', () => {
    const panelStore = usePanelStore()
    const tabsStore = useTabsStore()

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

    panelStore.dragPreview = {
      visible: true,
      position: 'right',
      targetPanelId: null,
      targetScope: 'container',
      panelBounds: {
        left: 0,
        top: 0,
        right: 1000,
        bottom: 800,
        width: 1000,
        height: 800
      }
    }

    panelStore.handleContainerDrop(tabsStore.tabs[0].id, 'right')

    expect(panelStore.rootPanel.direction).toBe('vertical')
    expect(panelStore.flatPanels).toHaveLength(2)
    expect(panelStore.flatPanels[1].tabs[0].id).toBe(tabsStore.tabs[0].id)
  })
})
