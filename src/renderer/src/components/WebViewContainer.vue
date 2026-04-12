<template>
  <div
    v-show="layout.visible"
    class="webview-container"
    :class="{ 'is-dragging': panelStore.isDraggingGlobal || panelStore.isResizingSplitters }"
    :style="containerStyle"
  >
    <webview
      v-if="hasLoaded"
      :src="model.url"
      :partition="`persist:${model.id}`"
      class="webview"
      :data-tab-id="tabId"
      @dom-ready="handleDomReady"
      @did-finish-load="handleFinishLoad"
      @did-fail-load="handleFailLoad"
    ></webview>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import type { AIModel } from '@shared/types'
import { usePanelStore } from '@/stores/panel'

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
const hasLoaded = ref(false)
const isDestroyed = ref(false)

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

function handleDomReady() {
  console.log('[WebView] DOM ready:', props.model.name)
}

function handleFinishLoad() {
  console.log('[WebView] Loaded:', props.model.name)
}

function handleFailLoad(event: any) {
  console.error('[WebView] Load failed:', props.model.name, event)
}
</script>

<style scoped>
.webview-container {
  position: absolute;
  overflow: hidden;
  pointer-events: auto;
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
