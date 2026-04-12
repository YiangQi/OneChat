<template>
  <div
    class="webview-container"
    :class="{
      'is-hidden': !layout.visible,
      'is-dragging': panelStore.isDraggingGlobal || panelStore.isResizingSplitters
    }"
    :style="containerStyle"
  >
    <webview
      v-if="hasLoaded"
      ref="webviewRef"
      :src="model.url"
      :partition="`persist:${model.id}`"
      class="webview"
      :data-tab-id="tabId"
      @did-start-loading="handleStartLoading"
      @dom-ready="handleDomReady"
      @did-finish-load="handleFinishLoad"
      @did-fail-load="handleFailLoad"
      @did-navigate="handleNavigate"
      @did-navigate-in-page="handleNavigate"
    ></webview>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import type { AIModel } from '@shared/types'
import { usePanelStore } from '@/stores/panel'
import { useComposerStore } from '@/stores/composer'
import { useThemeStore } from '@/stores/theme'
import {
  createCallBridgeBootstrapScript,
  createCallBridgeDispatchScript,
  createReadInvokedEventsScript,
  createScriptInjectionScript,
  loadCommonInjectScript,
  loadProviderInjectScript,
  type BrowserInvokeEvent,
  type WebviewInitArgs
} from '@/utils/webviewInjection'

const props = defineProps<{
  tabId: string
  model: AIModel
  layout: {
    visible: boolean
    left: number
    top: number
    width: number
    height: number
  }
}>()

const panelStore = usePanelStore()
const composerStore = useComposerStore()
const themeStore = useThemeStore()
const hasLoaded = ref(false)
const isDestroyed = ref(false)
const webviewRef = ref<Electron.WebviewTag>()
const isInjected = ref(false)
const isInjecting = ref(false)
const loadEndedSynced = ref(false)
const lastUrlChanged = ref('')
let injectionPromise: Promise<boolean> | null = null

const containerStyle = computed(() => ({
  left: `${props.layout.left}px`,
  top: `${props.layout.top}px`,
  width: `${props.layout.width}px`,
  height: `${props.layout.height}px`
}))

// Create each webview once, then only move/resize the wrapper to avoid reloads.
watch(() => props.layout.visible, (newVal) => {
  if (isDestroyed.value) return

  if (newVal && !hasLoaded.value) {
    setTimeout(() => {
      if (!isDestroyed.value) {
        hasLoaded.value = true
      }
    }, 100)
  }
}, { immediate: true })

onUnmounted(() => {
  isDestroyed.value = true
})

function mapThemeToAdapterValue() {
  if (themeStore.theme === 'auto') return 0
  return themeStore.currentTheme === 'light' ? 1 : 2
}

function getInitArgs(): WebviewInitArgs {
  return {
    isInputBoxVisible: composerStore.websiteInputVisible,
    isSidebarVisible: composerStore.websiteSidebarVisible,
    isDeepThinkChecked: false,
    isWebSearchChecked: false,
    appTheme: mapThemeToAdapterValue(),
    appLanguage: 0
  }
}

async function executeInWebview(script: string) {
  const webview = webviewRef.value
  if (!webview) return null

  return webview.executeJavaScript(script, false)
}

async function ensureInjected() {
  if (isInjected.value) return true
  if (injectionPromise) return injectionPromise

  injectionPromise = injectScripts()
    .finally(() => {
      injectionPromise = null
    })

  return injectionPromise
}

async function injectScripts() {
  if (isDestroyed.value || isInjecting.value) return false

  const webview = webviewRef.value
  if (!webview) return false

  isInjecting.value = true

  try {
    await executeInWebview(createCallBridgeBootstrapScript())

    const providerScript = await loadProviderInjectScript(props.model)
    if (providerScript) {
      await executeInWebview(createScriptInjectionScript('provider', providerScript, props.model.script ?? props.model.name))
    }

    const commonScript = await loadCommonInjectScript()
    if (commonScript) {
      await executeInWebview(createScriptInjectionScript('common', commonScript, 'common_inject.js'))
    }

    isInjected.value = true
    return true
  } catch (error) {
    console.error('[WebView] Injection failed:', props.model.name, error)
    return false
  } finally {
    isInjecting.value = false
  }
}

async function dispatchAdapterEvent(eventName: string, ...args: unknown[]) {
  const injected = await ensureInjected()
  if (!injected) return false

  try {
    return Boolean(await executeInWebview(createCallBridgeDispatchScript(eventName, args)))
  } catch (error) {
    console.error(`[WebView] Failed to dispatch ${eventName}:`, props.model.name, error)
    return false
  }
}

async function syncLoadEnded() {
  if (loadEndedSynced.value) return

  const dispatched = await dispatchAdapterEvent('loadEnded', getInitArgs())
  if (dispatched) {
    loadEndedSynced.value = true
    await drainBrowserInvokeEvents()
  }
}

async function syncUrlChanged() {
  const currentUrl = webviewRef.value?.getURL?.() ?? webviewRef.value?.getAttribute('src') ?? ''
  if (currentUrl && currentUrl === lastUrlChanged.value) return

  const dispatched = await dispatchAdapterEvent('urlChanged', getInitArgs())
  if (dispatched) {
    lastUrlChanged.value = currentUrl
    await drainBrowserInvokeEvents()
  }
}

async function drainBrowserInvokeEvents() {
  try {
    const events = await executeInWebview(createReadInvokedEventsScript(true)) as BrowserInvokeEvent[] | null
    if (!Array.isArray(events) || events.length === 0) return

    for (const event of events) {
      if (event.name === 'webLoadEnded') {
        loadEndedSynced.value = true
      }
      console.debug('[WebView] Browser method invoked:', props.model.name, event.name, event.args)
    }
  } catch (error) {
    console.warn('[WebView] Failed to read browser invoke events:', props.model.name, error)
  }
}

async function handleDomReady() {
  console.log('[WebView] DOM ready:', props.model.name)
  await ensureInjected()
}

function handleStartLoading() {
  isInjected.value = false
  loadEndedSynced.value = false
  lastUrlChanged.value = ''
}

async function handleFinishLoad() {
  console.log('[WebView] Loaded:', props.model.name)
  await syncLoadEnded()
}

function handleFailLoad(event: any) {
  console.error('[WebView] Load failed:', props.model.name, event)
}

async function handleNavigate() {
  await ensureInjected()
  await syncUrlChanged()
}
</script>

<style scoped>
.webview-container {
  position: absolute;
  overflow: hidden;
  pointer-events: auto;
}

.webview-container.is-hidden {
  pointer-events: none;
  opacity: 0;
}

.webview-container.is-dragging {
  pointer-events: none;
}

.webview {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
