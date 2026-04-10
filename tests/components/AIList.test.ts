import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AIList from '@/components/AIList.vue'
import * as fixtures from '../fixtures/ai-models'

describe('AIList Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should render AI models after loading', async () => {
    vi.mocked(window.electronAPI.readOnlineConfig).mockResolvedValue({
      models: fixtures.mockAIModels,
      onlineDir: '/online'
    })

    const wrapper = mount(AIList)

    // 等待组件挂载和异步加载
    await new Promise(resolve => setTimeout(resolve, 10))
    await wrapper.vm.$nextTick()

    const aiModelsStore = (await import('@/stores/aiModels')).useAIModelsStore()
    await aiModelsStore.loadModels()
    await wrapper.vm.$nextTick()

    // 验证模型名称被渲染
    expect(wrapper.text()).toContain('ChatGPT')
    expect(wrapper.text()).toContain('Claude')
    expect(wrapper.text()).toContain('DeepSeek')
  })

  it('should open tab when clicking AI model', async () => {
    vi.mocked(window.electronAPI.readOnlineConfig).mockResolvedValue({
      models: fixtures.mockAIModels,
      onlineDir: '/online'
    })

    const wrapper = mount(AIList)

    await new Promise(resolve => setTimeout(resolve, 10))

    const aiModelsStore = (await import('@/stores/aiModels')).useAIModelsStore()
    const tabsStore = (await import('@/stores/tabs')).useTabsStore()

    await aiModelsStore.loadModels()
    await wrapper.vm.$nextTick()

    const openTabSpy = vi.spyOn(tabsStore, 'openTab')

    // 点击第一个 AI 模型
    const items = wrapper.findAll('.ai-item')
    await items[0].trigger('click')

    expect(openTabSpy).toHaveBeenCalledWith(fixtures.mockAIModels[0])
  })

  it('should render correct icon path', async () => {
    vi.mocked(window.electronAPI.readOnlineConfig).mockResolvedValue({
      models: fixtures.mockAIModels,
      onlineDir: '/online'
    })

    const wrapper = mount(AIList)

    await new Promise(resolve => setTimeout(resolve, 10))

    const aiModelsStore = (await import('@/stores/aiModels')).useAIModelsStore()
    await aiModelsStore.loadModels()
    await wrapper.vm.$nextTick()

    const icons = wrapper.findAll('.ai-icon')
    expect(icons[0].attributes('src')).toBe('/online/openai_chatgpt/logo.png')
  })

  it('should render no models when empty', () => {
    vi.mocked(window.electronAPI.readOnlineConfig).mockResolvedValue({
      models: [],
      onlineDir: ''
    })

    const wrapper = mount(AIList)
    const items = wrapper.findAll('.ai-item')
    expect(items.length).toBe(0)
  })
})
