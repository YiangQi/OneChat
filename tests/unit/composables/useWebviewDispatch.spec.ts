import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWebviewDispatch } from '@/composables/useWebviewDispatch'
import { useComposerStore } from '@/stores/composer'
import { usePanelStore } from '@/stores/panel'
import { useTabsStore } from '@/stores/tabs'
import { IPC_CHANNELS } from '@shared/constants'
import type { AIModel } from '@shared/types'

const model = (id: string): AIModel => ({
  id,
  name: id,
  url: `https://example.com/${id}`,
  icon: `${id}.png`
})

function addWebview(tabId: string) {
  const webview = document.createElement('webview') as unknown as Electron.WebviewTag & {
    executeJavaScript: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
  }
  webview.setAttribute('data-tab-id', tabId)
  webview.setAttribute('src', `https://example.com/${tabId}`)
  webview.setAttribute('data-adapter-ready', 'true')
  webview.executeJavaScript = vi.fn(() => Promise.resolve(true))
  webview.send = vi.fn()
  document.body.appendChild(webview)
  return webview
}

describe('useWebviewDispatch', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('dispatches to the active tab only', async () => {
    const tabsStore = useTabsStore()
    usePanelStore()
    const composerStore = useComposerStore()
    const dispatch = useWebviewDispatch()

    tabsStore.openTab(model('chatgpt'))
    tabsStore.openTab(model('claude'))
    await nextTick()

    const chatgptWebview = addWebview(tabsStore.tabs[0].id)
    const claudeWebview = addWebview(tabsStore.tabs[1].id)

    composerStore.setTargetMode('active-tab')
    const count = dispatch.dispatchInputTextChanged('hello')

    expect(count).toBe(1)
    expect(chatgptWebview.send).not.toHaveBeenCalled()
    expect(claudeWebview.send).toHaveBeenCalledWith(IPC_CHANNELS.WEBVIEW_ADAPTER_EVENT, {
      eventName: 'inputTextChanged',
      args: ['hello']
    })
  })

  it('dispatches to all open tabs', async () => {
    const tabsStore = useTabsStore()
    usePanelStore()
    const composerStore = useComposerStore()
    const dispatch = useWebviewDispatch()

    tabsStore.openTab(model('chatgpt'))
    tabsStore.openTab(model('claude'))
    await nextTick()

    const chatgptWebview = addWebview(tabsStore.tabs[0].id)
    const claudeWebview = addWebview(tabsStore.tabs[1].id)

    composerStore.setTargetMode('all-tabs')
    const count = dispatch.dispatchInputTextSended()

    expect(count).toBe(2)
    expect(chatgptWebview.send).toHaveBeenCalledWith(IPC_CHANNELS.WEBVIEW_ADAPTER_EVENT, {
      eventName: 'inputTextSended',
      args: []
    })
    expect(claudeWebview.send).toHaveBeenCalledWith(IPC_CHANNELS.WEBVIEW_ADAPTER_EVENT, {
      eventName: 'inputTextSended',
      args: []
    })
  })

  it('sends file payloads through the webview adapter channel', async () => {
    const tabsStore = useTabsStore()
    usePanelStore()
    const dispatch = useWebviewDispatch()

    tabsStore.openTab(model('chatgpt'))
    await nextTick()

    const webview = addWebview(tabsStore.tabs[0].id)
    const count = dispatch.dispatchAddFileButtonClicked({
      data: 'aGVsbG8=',
      name: 'hello.txt',
      type: 'text/plain'
    })

    expect(count).toBe(1)
    expect(webview.send).toHaveBeenCalledWith(IPC_CHANNELS.WEBVIEW_ADAPTER_EVENT, {
      eventName: 'addFileButtonClicked',
      args: [{
        data: 'aGVsbG8=',
        name: 'hello.txt',
        type: 'text/plain'
      }]
    })
  })
})
