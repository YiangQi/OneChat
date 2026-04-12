import { useComposerTargets } from './useComposerTargets'

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
 * Safely execute a function in a webview's context.
 * Returns true if successful, false otherwise.
 */
function executeWebviewFunction(
  webview: Electron.WebviewTag,
  functionName: string,
  ...args: unknown[]
): boolean {
  try {
    // Check if webview is ready
    if (!webview.getAttribute('src')) {
      console.warn(`[WebviewDispatch] Webview not ready for ${functionName}`)
      return false
    }

    const serializedArgs = JSON.stringify(args)

    // Execute the function in the webview's context. File payloads cross the
    // boundary as base64 JSON and are rehydrated before calling provider code.
    const code = `
      (() => {
        const fn = window["${functionName}"];
        if (typeof fn !== "function") return false;
        const args = ${serializedArgs}.map((arg) => {
          if (!arg || typeof arg !== "object" || !("data" in arg) || !("name" in arg) || !("type" in arg)) {
            return arg;
          }

          const binary = atob(arg.data);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
          }

          return {
            data: bytes.buffer,
            fileName: arg.name,
            name: arg.name,
            fileType: arg.type,
            type: arg.type
          };
        });

        return fn(...args);
      })()
    `
    webview.executeJavaScript(code, false)
      .then((result: unknown) => {
        if (result === false) {
          console.warn(`[WebviewDispatch] Function ${functionName} not found or returned false`)
        }
      })
      .catch((error: Error) => {
        console.error(`[WebviewDispatch] Error executing ${functionName}:`, error)
      })

    return true
  } catch (error) {
    console.error(`[WebviewDispatch] Exception calling ${functionName}:`, error)
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

      // Map event names to inject.js function names
      const functionName = `on${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`
      const normalizedFunctionName = functionName.replace(/([A-Z])/g, '$1').replace(/([a-z])([A-Z])/g, '$1$2')

      if (executeWebviewFunction(webview, normalizedFunctionName, ...args)) {
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

    const functionName = `on${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`
    return executeWebviewFunction(webview, functionName, ...args)
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
