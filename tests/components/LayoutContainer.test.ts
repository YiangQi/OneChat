import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LayoutContainer from '@/components/LayoutContainer.vue'

describe('LayoutContainer', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = '<div id="app"></div>'
  })

  it('should show empty state when no tabs', () => {
    const wrapper = mount(LayoutContainer)
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.text()).toContain('从左侧选择一个 AI 模型开始对话')
  })

  it('should initialize Golden Layout on mount', async () => {
    const wrapper = mount(LayoutContainer)
    await wrapper.vm.$nextTick()

    // 验证容器元素存在
    expect(wrapper.find('.golden-layout-container').exists()).toBe(true)
  })
})
