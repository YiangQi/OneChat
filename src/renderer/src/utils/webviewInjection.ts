import type { AIModel } from '@shared/types'

const COMMON_INJECT_SCRIPT = 'common_inject.js'
const INJECTION_STATE_KEY = '__ONECHAT_INJECTION__'

export interface WebviewInitArgs {
  isInputBoxVisible: boolean
  isSidebarVisible: boolean
  isDeepThinkChecked: boolean
  isWebSearchChecked: boolean
  appTheme: number
  appLanguage: number
}

export interface BrowserInvokeEvent {
  name: string
  args: unknown[]
  timestamp: number
}

export function serializeForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export async function loadOnlineScript(path: string | undefined, label: string): Promise<string | null> {
  if (!path) {
    console.warn(`[WebviewInjection] Missing ${label} script path`)
    return null
  }

  try {
    const script = await window.electronAPI.readOnlineScript(path)
    if (!script) {
      console.warn(`[WebviewInjection] Failed to load ${label} script: ${path}`)
      return null
    }

    if (!script.trim()) {
      console.warn(`[WebviewInjection] Empty ${label} script: ${path}`)
      return null
    }

    return script
  } catch (error) {
    console.warn(`[WebviewInjection] Error loading ${label} script: ${path}`, error)
    return null
  }
}

export function loadCommonInjectScript() {
  return loadOnlineScript(COMMON_INJECT_SCRIPT, 'common inject')
}

export function loadProviderInjectScript(model: AIModel) {
  return loadOnlineScript(model.script, `${model.name} provider`)
}

export function createCallBridgeBootstrapScript() {
  return `
    (() => {
      const stateKey = ${serializeForScript(INJECTION_STATE_KEY)};
      const state = window[stateKey] || (window[stateKey] = {
        bridgeReady: false,
        providerInjected: false,
        commonInjected: false,
        loadEndedDispatched: false,
        lastUrlChanged: "",
        invokeEvents: []
      });

      if (state.bridgeReady && window.CallBridge) {
        return { ok: true, reused: true };
      }

      const listeners = Object.create(null);

      window.CallBridge = {
        addEventListener(name, handler) {
          if (typeof name !== "string" || typeof handler !== "function") {
            return false;
          }

          const bucket = listeners[name] || (listeners[name] = []);
          if (!bucket.includes(handler)) {
            bucket.push(handler);
          }
          return true;
        },

        dispatchEvent(name, ...args) {
          const bucket = listeners[name];
          if (!bucket || bucket.length === 0) {
            console.debug("[OneChat CallBridge] no listener", name);
            return 0;
          }

          let handled = 0;
          for (const handler of [...bucket]) {
            try {
              handler(...args);
              handled += 1;
            } catch (error) {
              console.error("[OneChat CallBridge] listener failed", name, error);
            }
          }
          return handled;
        },

        invoke(name, ...args) {
          const event = {
            name,
            args,
            timestamp: Date.now()
          };

          state.invokeEvents.push(event);
          if (state.invokeEvents.length > 100) {
            state.invokeEvents.shift();
          }

          if (name === "webLoadEnded") {
            state.webLoadEnded = true;
          }

          console.debug("[OneChat CallBridge] invoke", name, args);
          return true;
        },

        getInvokedEvents() {
          return state.invokeEvents.slice();
        },

        clearInvokedEvents() {
          const events = state.invokeEvents.slice();
          state.invokeEvents.length = 0;
          return events;
        }
      };

      state.bridgeReady = true;
      return { ok: true, reused: false };
    })()
  `
}

export function createScriptInjectionScript(kind: 'provider' | 'common', script: string, sourceName: string) {
  const injectedFlag = kind === 'provider' ? 'providerInjected' : 'commonInjected'
  const sourceKey = kind === 'provider' ? 'providerScript' : 'commonScript'

  return `
    (() => {
      const stateKey = ${serializeForScript(INJECTION_STATE_KEY)};
      const state = window[stateKey] || (window[stateKey] = {});
      const sourceName = ${serializeForScript(sourceName)};

      if (state[${serializeForScript(injectedFlag)}] && state[${serializeForScript(sourceKey)}] === sourceName) {
        return { ok: true, reused: true, kind: ${serializeForScript(kind)} };
      }

      try {
        (0, eval)(${serializeForScript(script)});
        state[${serializeForScript(injectedFlag)}] = true;
        state[${serializeForScript(sourceKey)}] = sourceName;
        return { ok: true, reused: false, kind: ${serializeForScript(kind)} };
      } catch (error) {
        console.error("[OneChat Injection] failed", ${serializeForScript(kind)}, sourceName, error);
        return {
          ok: false,
          kind: ${serializeForScript(kind)},
          message: error instanceof Error ? error.message : String(error)
        };
      }
    })()
  `
}

function normalizeFilePayloadArg(arg: string) {
  return `
    if (arg && typeof arg === "object" && "data" in arg && "name" in arg && "type" in arg) {
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
    }
  `
}

export function createCallBridgeDispatchScript(eventName: string, args: unknown[]) {
  return `
    (() => {
      if (!window.CallBridge || typeof window.CallBridge.dispatchEvent !== "function") {
        return false;
      }

      const args = ${serializeForScript(args)}.map((arg) => {
        ${normalizeFilePayloadArg('arg')}
        return arg;
      });

      window.CallBridge.dispatchEvent(${serializeForScript(eventName)}, ...args);
      return true;
    })()
  `
}

export function createReadInvokedEventsScript(clear = true) {
  const method = clear ? 'clearInvokedEvents' : 'getInvokedEvents'
  return `
    (() => {
      if (!window.CallBridge || typeof window.CallBridge.${method} !== "function") {
        return [];
      }
      return window.CallBridge.${method}();
    })()
  `
}
