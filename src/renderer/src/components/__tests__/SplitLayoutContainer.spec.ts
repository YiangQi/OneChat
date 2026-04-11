import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import SplitLayoutContainer from '../SplitLayoutContainer.vue'

describe('SplitLayoutContainer', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('应该渲染一个默认面板', () => {
    const wrapper = mount(SplitLayoutContainer)

    expect(wrapper.find('.split-layout-container').exists()).toBe(true)
    expect(wrapper.find('.splitpanes-root').exists()).toBe(true)
  })

  it('分屏后应该渲染两个面板', async () => {
    const wrapper = mount(SplitLayoutContainer)
    const { usePanelStore } = await import('@/stores/panel')
    const panelStore = usePanelStore()

    const initialPanels = panelStore.flatPanels.length
    expect(initialPanels).toBe(1)

    panelStore.splitPanel('panel-default', 'after', 'horizontal')
    await wrapper.vm.$nextTick()

    const afterSplitPanels = panelStore.flatPanels.length
    expect(afterSplitPanels).toBe(2)
  })
})
