import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePanelStore } from '../panel'

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
