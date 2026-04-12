import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import TabGroup from '../TabGroup.vue'
import type { Panel } from '@/stores/panel'

describe('TabGroup', () => {
  const mockPanel: Panel = {
    id: 'panel-1',
    tabIds: [],
    activeTabId: ''
  }

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('应该渲染标签页组容器', () => {
    const wrapper = mount(TabGroup, {
      props: { panel: mockPanel }
    })

    expect(wrapper.find('.tab-group').exists()).toBe(true)
  })

  it('应该显示面板中的标签页', () => {
    const panelWithTabs: Panel = {
      ...mockPanel,
      tabIds: ['tab-1'],
      tabs: [{
        id: 'tab-1',
        modelId: 'chatgpt',
        model: {
          id: 'chatgpt',
          name: 'ChatGPT',
          url: 'https://chat.openai.com',
          icon: 'chatgpt.png'
        },
        createdAt: Date.now()
      }],
      activeTabId: 'tab-1'
    }

    const wrapper = mount(TabGroup, {
      props: { panel: panelWithTabs }
    })

    expect(wrapper.find('.tab').exists()).toBe(true)
    expect(wrapper.text()).toContain('ChatGPT')
  })
})
