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
