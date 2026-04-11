<template>
  <div v-show="visible" class="webview-container" :class="{ 'is-dragging': panelStore.isDraggingGlobal }">
    <webview
      v-if="hasLoaded"
      :src="model.url"
      :partition="`persist:${model.id}`"
      class="webview"
      :data-tab-id="model.id"
      @dom-ready="handleDomReady"
      @did-finish-load="handleFinishLoad"
      @did-fail-load="handleFailLoad"
    ></webview>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import type { AIModel } from '@shared/types'
import { usePanelStore } from '@/stores/panel'

const props = defineProps<{
  model: AIModel
  visible?: boolean
}>()

const panelStore = usePanelStore()
const hasLoaded = ref(false)
const isDestroyed = ref(false)

// 当 visible 变为 true 时，才加载 webview
watch(() => props.visible, (newVal) => {
  if (isDestroyed.value) return

  if (newVal && !hasLoaded.value) {
    // 延迟加载，避免同时加载多个 webview
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* 拖拽时禁用 webview 的鼠标事件，让拖拽可以穿透 */
.webview-container.is-dragging .webview {
  pointer-events: none;
}

.webview {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
