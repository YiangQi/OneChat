import { useComposerTargets } from './useComposerTargets'
import { createCallBridgeDispatchScript } from '@/utils/webviewInjection'

/**
 * Event types that can be dispatched to webview adapters.
 * These correspond to the global functions defined in inject.js files.
 */
export interface WebviewEvents {
  // Text events
  inputTextChanged: (text: string) => void
  inputTextSended: () => void

  // Visibility events
  inputBoxVisibleChanged: (visible: boolean) => void
  sidebarVisibleChanged: (visible: boolean) => void

  // Action events
  loginButtonClicked: () => void
  chatNewButtonClicked: () => void

  // Attachment events
  addImageButtonClicked: (payload: FilePayload) => void
  addFileButtonClicked: (payload: FilePayload) => void
}

export interface FilePayload {
  data: string // base64 encoded data
  name: string
  type: string // MIME type
}

/**
 * Safely dispatch an adapter event in a webview's context.
 * Returns true if successful, false otherwise.
 */
function executeWebviewEvent(
  webview: Electron.WebviewTag,
  eventName: string,
  ...args: unknown[]
): boolean {
  try {
    // Check if webview is ready
    if (!webview.getAttribute('src')) {
      console.warn(`[WebviewDispatch] Webview not ready for ${eventName}`)
      return false
    }

    const code = createCallBridgeDispatchScript(eventName, args)
    webview.executeJavaScript(code, false)
      .then((result: unknown) => {
        if (result === false) {
          console.warn(`[WebviewDispatch] CallBridge unavailable for ${eventName}`)
        }
      })
      .catch((error: Error) => {
        console.error(`[WebviewDispatch] Error dispatching ${eventName}:`, error)
      })

    return true
  } catch (error) {
    console.error(`[WebviewDispatch] Exception dispatching ${eventName}:`, error)
    return false
  }
}

/**
 * Composable for dispatching composer actions to target webviews.
 */
export function useWebviewDispatch() {
  const { targetTabs, readyTargets, getWebviewForTab } = useComposerTargets()

  /**
   * Dispatch an event to all ready target webviews.
   * Returns the number of webviews that received the event.
   */
  function dispatchToTargets<K extends keyof WebviewEvents>(
    eventName: K,
    ...args: Parameters<WebviewEvents[K]>
  ): number {
    let successCount = 0

    for (const target of readyTargets.value) {
      const webview = getWebviewForTab(target.tab.id)
      if (!webview) continue

      if (executeWebviewEvent(webview, eventName, ...args)) {
        successCount++
      }
    }

    return successCount
  }

  /**
   * Dispatch an event to a specific tab's webview.
   * Returns true if the event was dispatched.
   */
  function dispatchToTab<K extends keyof WebviewEvents>(
    tabId: string,
    eventName: K,
    ...args: Parameters<WebviewEvents[K]>
  ): boolean {
    const webview = getWebviewForTab(tabId)
    if (!webview) return false

    return executeWebviewEvent(webview, eventName, ...args)
  }

  /**
   * Text sync events
   */
  function dispatchInputTextChanged(text: string): number {
    return dispatchToTargets('inputTextChanged', text)
  }

  function dispatchInputTextSended(): number {
    return dispatchToTargets('inputTextSended')
  }

  /**
   * Visibility events
   */
  function dispatchInputBoxVisibleChanged(visible: boolean): number {
    return dispatchToTargets('inputBoxVisibleChanged', visible)
  }

  function dispatchSidebarVisibleChanged(visible: boolean): number {
    return dispatchToTargets('sidebarVisibleChanged', visible)
  }

  /**
   * Action events
   */
  function dispatchLoginButtonClicked(): number {
    return dispatchToTargets('loginButtonClicked')
  }

  function dispatchChatNewButtonClicked(): number {
    return dispatchToTargets('chatNewButtonClicked')
  }

  /**
   * Attachment events
   */
  function dispatchAddImageButtonClicked(payload: FilePayload): number {
    return dispatchToTargets('addImageButtonClicked', payload)
  }

  function dispatchAddFileButtonClicked(payload: FilePayload): number {
    return dispatchToTargets('addFileButtonClicked', payload)
  }

  return {
    // Target state
    targetTabs,
    readyTargets,

    // Generic dispatch
    dispatchToTargets,
    dispatchToTab,

    // Text events
    dispatchInputTextChanged,
    dispatchInputTextSended,

    // Visibility events
    dispatchInputBoxVisibleChanged,
    dispatchSidebarVisibleChanged,

    // Action events
    dispatchLoginButtonClicked,
    dispatchChatNewButtonClicked,

    // Attachment events
    dispatchAddImageButtonClicked,
    dispatchAddFileButtonClicked
  }
}
