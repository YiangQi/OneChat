import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BottomComposer from '@/components/BottomComposer.vue'
import { useComposerStore } from '@/stores/composer'
import { useTabsStore } from '@/stores/tabs'
import type { AIModel } from '@shared/types'

const mockDispatch = vi.hoisted(() => ({
  targetTabs: [] as unknown[],
  dispatchInputTextChanged: vi.fn(),
  dispatchInputTextSended: vi.fn(),
  dispatchSidebarVisibleChanged: vi.fn(),
  dispatchInputBoxVisibleChanged: vi.fn(),
  dispatchChatNewButtonClicked: vi.fn(),
  dispatchLoginButtonClicked: vi.fn(),
  dispatchAddImageButtonClicked: vi.fn(),
  dispatchAddFileButtonClicked: vi.fn()
}))

vi.mock('@/composables/useWebviewDispatch', () => ({
  useWebviewDispatch: () => ({
    targetTabs: { value: mockDispatch.targetTabs },
    readyTargets: { value: [] },
    dispatchInputTextChanged: mockDispatch.dispatchInputTextChanged,
    dispatchInputTextSended: mockDispatch.dispatchInputTextSended,
    dispatchSidebarVisibleChanged: mockDispatch.dispatchSidebarVisibleChanged,
    dispatchInputBoxVisibleChanged: mockDispatch.dispatchInputBoxVisibleChanged,
    dispatchChatNewButtonClicked: mockDispatch.dispatchChatNewButtonClicked,
    dispatchLoginButtonClicked: mockDispatch.dispatchLoginButtonClicked,
    dispatchAddImageButtonClicked: mockDispatch.dispatchAddImageButtonClicked,
    dispatchAddFileButtonClicked: mockDispatch.dispatchAddFileButtonClicked
  })
}))

const model: AIModel = {
  id: 'chatgpt',
  name: 'ChatGPT',
  url: 'https://chat.openai.com',
  icon: 'chatgpt.png'
}

function mountComposer() {
  return mount(BottomComposer)
}

describe('BottomComposer', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    mockDispatch.targetTabs = []
    mockDispatch.dispatchInputTextChanged.mockClear()
    mockDispatch.dispatchInputTextSended.mockClear()
    mockDispatch.dispatchSidebarVisibleChanged.mockClear()
    mockDispatch.dispatchInputBoxVisibleChanged.mockClear()
    mockDispatch.dispatchChatNewButtonClicked.mockClear()
    mockDispatch.dispatchLoginButtonClicked.mockClear()
    mockDispatch.dispatchAddImageButtonClicked.mockClear()
    mockDispatch.dispatchAddFileButtonClicked.mockClear()
  })

  it('renders the reference-style composer controls', () => {
    const wrapper = mountComposer()

    expect(wrapper.find('[data-testid="bottom-composer"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="composer-textarea"]').attributes('placeholder')).toBe('向 OneChat 提问...')
    expect(wrapper.text()).toContain('Send to:')
    expect(wrapper.text()).toContain('使用 CTRL+ENTER 换行。')
  })

  it('preserves draft text while collapsed and expanded', async () => {
    const store = useComposerStore()
    const wrapper = mountComposer()

    await wrapper.find('[data-testid="composer-textarea"]').setValue('keep this')
    store.toggleCollapsed()
    await wrapper.vm.$nextTick()
    store.toggleCollapsed()
    await wrapper.vm.$nextTick()

    expect(store.draftText).toBe('keep this')
    expect((wrapper.find('[data-testid="composer-textarea"]').element as HTMLTextAreaElement).value).toBe('keep this')
  })

  it('disables send when there is no target tab', async () => {
    const wrapper = mountComposer()

    await wrapper.find('[data-testid="composer-textarea"]').setValue('hello')

    expect(wrapper.find('.send-button').attributes('disabled')).toBeDefined()
  })

  it('sends draft text when a target tab exists', async () => {
    const tabsStore = useTabsStore()
    tabsStore.openTab(model)
    mockDispatch.targetTabs = [{ tab: tabsStore.tabs[0], panelId: 'panel-default' }]
    const wrapper = mountComposer()

    await wrapper.find('[data-testid="composer-textarea"]').setValue('hello')
    await wrapper.find('.send-button').trigger('click')

    expect(mockDispatch.dispatchInputTextChanged).toHaveBeenCalledWith('hello')
    expect(mockDispatch.dispatchInputTextSended).toHaveBeenCalled()
    expect(useComposerStore().draftText).toBe('')
  })

  it('dispatches toolbar visibility controls', async () => {
    const wrapper = mountComposer()

    await wrapper.find('button[aria-label="隐藏网页侧边栏"]').trigger('click')
    await wrapper.find('button[aria-label="隐藏网页输入框"]').trigger('click')

    expect(mockDispatch.dispatchSidebarVisibleChanged).toHaveBeenCalledWith(false)
    expect(mockDispatch.dispatchInputBoxVisibleChanged).toHaveBeenCalledWith(false)
  })
})
