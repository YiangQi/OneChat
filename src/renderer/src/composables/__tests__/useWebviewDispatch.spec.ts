import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWebviewDispatch } from '../useWebviewDispatch'
import { useComposerStore } from '@/stores/composer'
import { usePanelStore } from '@/stores/panel'
import { useTabsStore } from '@/stores/tabs'
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
  }
  webview.setAttribute('data-tab-id', tabId)
  webview.setAttribute('src', `https://example.com/${tabId}`)
  webview.executeJavaScript = vi.fn(() => Promise.resolve(true))
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
    expect(chatgptWebview.executeJavaScript).not.toHaveBeenCalled()
    expect(claudeWebview.executeJavaScript).toHaveBeenCalledWith(expect.stringContaining('onInputTextChanged'), false)
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
    expect(chatgptWebview.executeJavaScript).toHaveBeenCalledWith(expect.stringContaining('onInputTextSended'), false)
    expect(claudeWebview.executeJavaScript).toHaveBeenCalledWith(expect.stringContaining('onInputTextSended'), false)
  })

  it('rehydrates file payloads inside the webview script', async () => {
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
    expect(webview.executeJavaScript).toHaveBeenCalledWith(expect.stringContaining('bytes.buffer'), false)
    expect(webview.executeJavaScript).toHaveBeenCalledWith(expect.stringContaining('fileName: arg.name'), false)
  })
})
