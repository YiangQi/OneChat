import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import WebViewContainer from '../WebViewContainer.vue'
import type { AIModel } from '@shared/types'

const injectionMock = vi.hoisted(() => ({
  loadProviderInjectScript: vi.fn(),
  loadCommonInjectScript: vi.fn(),
  createCallBridgeBootstrapScript: vi.fn(() => 'bridge-script'),
  createScriptInjectionScript: vi.fn((kind: string) => `${kind}-script`),
  createCallBridgeDispatchScript: vi.fn((eventName: string) => `${eventName}-dispatch`),
  createReadInvokedEventsScript: vi.fn(() => 'read-invoke-events')
}))

vi.mock('@/utils/webviewInjection', () => ({
  ...injectionMock
}))

const model: AIModel = {
  id: 'chatgpt',
  name: 'ChatGPT',
  url: 'https://chat.openai.com',
  icon: 'chatgpt.png',
  script: 'openai_chatgpt/inject.js'
}

function mountContainer(customModel = model) {
  return mount(WebViewContainer, {
    props: {
      tabId: 'tab-1',
      model: customModel,
      layout: {
        visible: true,
        left: 0,
        top: 0,
        width: 800,
        height: 600
      }
    }
  })
}

async function prepareWebview(wrapper: ReturnType<typeof mountContainer>) {
  await flushPromises()
  vi.advanceTimersByTime(120)
  await wrapper.vm.$nextTick()
  await flushPromises()

  const element = wrapper.find('webview').element as unknown as Electron.WebviewTag & {
    executeJavaScript: ReturnType<typeof vi.fn>
    getURL: ReturnType<typeof vi.fn>
  }

  element.executeJavaScript = vi.fn(async (script: string) => {
    if (script === 'read-invoke-events') return []
    return true
  })
  element.getURL = vi.fn(() => 'https://chat.openai.com/')

  return element
}

async function triggerAndFlush(wrapper: ReturnType<typeof mountContainer>, eventName: string) {
  await wrapper.find('webview').trigger(eventName)
  await flushPromises()
  await wrapper.vm.$nextTick()
  await flushPromises()
}

describe('WebViewContainer injection', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    setActivePinia(createPinia())
    injectionMock.loadProviderInjectScript.mockResolvedValue('provider source')
    injectionMock.loadCommonInjectScript.mockResolvedValue('common source')
    injectionMock.createCallBridgeBootstrapScript.mockClear()
    injectionMock.createScriptInjectionScript.mockClear()
    injectionMock.createCallBridgeDispatchScript.mockClear()
    injectionMock.createReadInvokedEventsScript.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('injects bridge, provider, and common scripts in order', async () => {
    const wrapper = mountContainer()
    const webview = await prepareWebview(wrapper)

    await triggerAndFlush(wrapper, 'dom-ready')

    expect(webview.executeJavaScript).toHaveBeenNthCalledWith(1, 'bridge-script', false)
    expect(webview.executeJavaScript).toHaveBeenNthCalledWith(2, 'provider-script', false)
    expect(webview.executeJavaScript).toHaveBeenNthCalledWith(3, 'common-script', false)
    expect(injectionMock.createScriptInjectionScript).toHaveBeenNthCalledWith(1, 'provider', 'provider source', 'openai_chatgpt/inject.js')
    expect(injectionMock.createScriptInjectionScript).toHaveBeenNthCalledWith(2, 'common', 'common source', 'common_inject.js')
  })

  it('dispatches loadEnded after load completion', async () => {
    const wrapper = mountContainer()
    const webview = await prepareWebview(wrapper)

    await triggerAndFlush(wrapper, 'dom-ready')
    await triggerAndFlush(wrapper, 'did-finish-load')

    expect(injectionMock.createCallBridgeDispatchScript).toHaveBeenCalledWith('loadEnded', [
      expect.objectContaining({
        isInputBoxVisible: true,
        isSidebarVisible: true,
        isDeepThinkChecked: false,
        isWebSearchChecked: false,
        appLanguage: 0
      })
    ])
    expect(webview.executeJavaScript).toHaveBeenCalledWith('loadEnded-dispatch', false)
  })

  it('dispatches urlChanged on navigation', async () => {
    const wrapper = mountContainer()
    const webview = await prepareWebview(wrapper)

    await triggerAndFlush(wrapper, 'dom-ready')
    await triggerAndFlush(wrapper, 'did-navigate')

    expect(injectionMock.createCallBridgeDispatchScript).toHaveBeenCalledWith('urlChanged', [expect.any(Object)])
    expect(webview.executeJavaScript).toHaveBeenCalledWith('urlChanged-dispatch', false)
  })

  it('keeps the webview usable when provider script is missing', async () => {
    injectionMock.loadProviderInjectScript.mockResolvedValue(null)
    const wrapper = mountContainer({ ...model, script: undefined })
    const webview = await prepareWebview(wrapper)

    await triggerAndFlush(wrapper, 'dom-ready')

    expect(webview.executeJavaScript).toHaveBeenCalledWith('bridge-script', false)
    expect(webview.executeJavaScript).toHaveBeenCalledWith('common-script', false)
  })

  it('does not repeat injection in the same page context', async () => {
    const wrapper = mountContainer()
    const webview = await prepareWebview(wrapper)

    await triggerAndFlush(wrapper, 'dom-ready')
    await triggerAndFlush(wrapper, 'dom-ready')

    expect(webview.executeJavaScript).toHaveBeenCalledTimes(3)
  })

  it('stores browser conversation events', async () => {
    const wrapper = mountContainer()
    const webview = await prepareWebview(wrapper)
    const conversationsStore = (await import('@/stores/conversations')).useConversationsStore()

    webview.executeJavaScript.mockImplementation(async (script: string) => {
      if (script === 'read-invoke-events') {
        return [
          { name: 'webConversationListUpdated', args: [[{ id: 'c1', title: 'First chat' }]], timestamp: 1 },
          { name: 'webConversationChanged', args: ['c1'], timestamp: 2 }
        ]
      }
      return true
    })

    await triggerAndFlush(wrapper, 'dom-ready')
    await triggerAndFlush(wrapper, 'did-finish-load')

    expect(conversationsStore.byModelId.chatgpt.conversations).toEqual([{ id: 'c1', title: 'First chat' }])
    expect(conversationsStore.byModelId.chatgpt.activeConversationId).toBe('c1')
  })

  it('polls delayed browser conversation events after injection', async () => {
    const wrapper = mountContainer()
    const webview = await prepareWebview(wrapper)
    const conversationsStore = (await import('@/stores/conversations')).useConversationsStore()
    let shouldReturnEvents = false

    webview.executeJavaScript.mockImplementation(async (script: string) => {
      if (script === 'read-invoke-events') {
        if (!shouldReturnEvents) return []
        shouldReturnEvents = false
        return [
          { name: 'webConversationListUpdated', args: [[{ id: 'late-1', title: 'Late chat' }]], timestamp: 1 }
        ]
      }
      return true
    })

    await triggerAndFlush(wrapper, 'dom-ready')
    shouldReturnEvents = true
    vi.advanceTimersByTime(1000)
    await flushPromises()

    expect(conversationsStore.byModelId.chatgpt.conversations).toEqual([{ id: 'late-1', title: 'Late chat' }])
  })

})
