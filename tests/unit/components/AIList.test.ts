import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AIList from '@/components/AIList.vue'
import { IPC_CHANNELS } from '@shared/constants'
import * as fixtures from '../../fixtures/ai-models'

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
    expect(icons[0].attributes('src')).toBe('online://openai_chatgpt/logo.png')
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

  it('renders open model conversations and active state', async () => {
    vi.mocked(window.electronAPI.readOnlineConfig).mockResolvedValue({
      models: fixtures.mockAIModels,
      onlineDir: '/online'
    })

    const wrapper = mount(AIList)
    const aiModelsStore = (await import('@/stores/aiModels')).useAIModelsStore()
    const tabsStore = (await import('@/stores/tabs')).useTabsStore()
    const conversationsStore = (await import('@/stores/conversations')).useConversationsStore()

    await aiModelsStore.loadModels()
    tabsStore.openTab(fixtures.mockAIModels[0])
    conversationsStore.setConversations('model-0', [
      { id: 'c1', title: 'First chat', subTitle: 'Today' },
      { id: 'c2', title: 'Second chat' }
    ])
    conversationsStore.setActiveConversation('model-0', 'c2')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('First chat')
    expect(wrapper.text()).toContain('Second chat')
    expect(wrapper.find('.conversation-item.is-active').text()).toContain('Second chat')
  })

  it('hides conversation children after the model tab closes', async () => {
    vi.mocked(window.electronAPI.readOnlineConfig).mockResolvedValue({
      models: fixtures.mockAIModels,
      onlineDir: '/online'
    })

    const wrapper = mount(AIList)
    const aiModelsStore = (await import('@/stores/aiModels')).useAIModelsStore()
    const tabsStore = (await import('@/stores/tabs')).useTabsStore()
    const conversationsStore = (await import('@/stores/conversations')).useConversationsStore()

    await aiModelsStore.loadModels()
    tabsStore.openTab(fixtures.mockAIModels[0])
    const tabId = tabsStore.tabs[0].id
    conversationsStore.setConversations('model-0', [{ id: 'c1', title: 'First chat' }])
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('First chat')

    tabsStore.closeTab(tabId)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).not.toContain('First chat')
  })

  it('dispatches conversation clicks through the webview dispatch path', async () => {
    vi.mocked(window.electronAPI.readOnlineConfig).mockResolvedValue({
      models: fixtures.mockAIModels,
      onlineDir: '/online'
    })

    const wrapper = mount(AIList)
    const aiModelsStore = (await import('@/stores/aiModels')).useAIModelsStore()
    const tabsStore = (await import('@/stores/tabs')).useTabsStore()
    const conversationsStore = (await import('@/stores/conversations')).useConversationsStore()

    await aiModelsStore.loadModels()
    tabsStore.openTab(fixtures.mockAIModels[0])
    const tabId = tabsStore.tabs[0].id
    conversationsStore.setConversations('model-0', [{ id: 'c1', title: 'First chat' }])
    await wrapper.vm.$nextTick()

    const webview = document.createElement('webview') as unknown as Electron.WebviewTag & {
      send: ReturnType<typeof vi.fn>
    }
    webview.setAttribute('data-tab-id', tabId)
    webview.setAttribute('src', fixtures.mockAIModels[0].url)
    webview.setAttribute('data-adapter-ready', 'true')
    webview.send = vi.fn()
    document.body.appendChild(webview)

    await wrapper.find('.conversation-item').trigger('click')

    expect(webview.send).toHaveBeenCalledWith(IPC_CHANNELS.WEBVIEW_ADAPTER_EVENT, {
      eventName: 'conversationClicked',
      args: ['c1', 'First chat']
    })

    webview.remove()
  })
})
