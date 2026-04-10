import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TabItem from '@/components/TabItem.vue'
import * as fixtures from '../fixtures/ai-models'

describe('TabItem Component', () => {
  const mockModel = fixtures.mockAIModels[0]
  const mockIcon = '/online/openai_chatgpt/logo.png'

  it('should render model name and icon', () => {
    const wrapper = mount(TabItem, {
      props: {
        model: mockModel,
        icon: mockIcon,
        active: false
      }
    })

    expect(wrapper.text()).toContain('ChatGPT')
    expect(wrapper.find('.tab-icon').attributes('src')).toBe(mockIcon)
  })

  it('should emit close event when close button clicked', async () => {
    const wrapper = mount(TabItem, {
      props: {
        model: mockModel,
        icon: mockIcon,
        active: false
      }
    })

    await wrapper.find('.tab-close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should have active class when active is true', () => {
    const wrapper = mount(TabItem, {
      props: {
        model: mockModel,
        icon: mockIcon,
        active: true
      }
    })

    expect(wrapper.find('.tab-item').classes()).toContain('active')
  })

  it('should not have active class when active is false', () => {
    const wrapper = mount(TabItem, {
      props: {
        model: mockModel,
        icon: mockIcon,
        active: false
      }
    })

    expect(wrapper.find('.tab-item').classes()).not.toContain('active')
  })

  it('should render close icon', () => {
    const wrapper = mount(TabItem, {
      props: {
        model: mockModel,
        icon: mockIcon,
        active: false
      }
    })

    expect(wrapper.find('.tab-close').exists()).toBe(true)
  })
})
