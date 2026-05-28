<template>
  <div
    ref="containerRef"
    class="split-layout-container"
    @dragover="handleContainerDragOver"
    @drop="handleContainerDrop"
    @dragleave="handleContainerDragLeave"
  >
    <div class="splitpanes-root">
      <PanelRenderer :panel="panelStore.rootPanel" />
    </div>
    <WebViewLayer />
    <DragPreviewLayer />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePanelStore } from '@/stores/panel'
import PanelRenderer from './PanelRenderer.vue'
import DragPreviewLayer from './DragPreviewLayer.vue'
import WebViewLayer from './WebViewLayer.vue'

const panelStore = usePanelStore()
const containerRef = ref<HTMLElement>()
const isDragOverContainer = ref(false)

function handleContainerDragOver(e: DragEvent) {
  if (!panelStore.isDraggingGlobal || !containerRef.value) return

  e.preventDefault()
  isDragOverContainer.value = true

  const rect = containerRef.value.getBoundingClientRect()
  panelStore.handleContainerDragOver(e, rect)
}

function handleContainerDrop(e: DragEvent) {
  if (panelStore.dragPreview.targetScope !== 'container') return

  e.preventDefault()
  e.stopPropagation()

  try {
    const data = e.dataTransfer?.getData('text/plain')
    if (!data) return

    const { tabId } = JSON.parse(data)
    const position = panelStore.dragPreview.position
    if (tabId && position) {
      panelStore.handleContainerDrop(tabId, position)
    }
  } catch (err) {
    console.error('[SplitLayoutContainer] Drop error:', err)
  } finally {
    isDragOverContainer.value = false
  }
}

function handleContainerDragLeave(e: DragEvent) {
  // 检查是否真的离开了容器（而不是进入子元素）
  const container = e.currentTarget as HTMLElement
  const rect = container.getBoundingClientRect()

  const x = e.clientX
  const y = e.clientY

  // 如果鼠标在容器边界内，说明是进入了子元素，不应该隐藏预览
  if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
    return
  }

  // 真正离开了容器，清除所有拖拽状�?  isDragOverContainer.value = false
  panelStore.dragPreview = {
    visible: false,
    position: null,
    targetPanelId: null,
    targetScope: 'container',
    blocked: false,
    message: undefined
  }
  panelStore.isDraggingGlobal = false
}
</script>

<style scoped>
.split-layout-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: var(--bg-primary);
  min-width: 0;
  min-height: 0;
  position: relative;
}

.splitpanes-root {
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}
</style>
