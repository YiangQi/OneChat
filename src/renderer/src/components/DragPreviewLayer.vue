<template>
  <div
    class="drag-preview"
    :class="[previewClass, { 'drag-preview--visible': panelStore.dragPreview.visible }]"
    :style="previewStyle"
  ></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePanelStore } from '@/stores/panel'

const panelStore = usePanelStore()

const previewClass = computed(() => {
  const position = panelStore.dragPreview.position
  if (!position) return ''
  return `preview-${position}`
})

const previewStyle = computed(() => {
  const bounds = panelStore.dragPreview.panelBounds
  if (!bounds || !panelStore.dragPreview.visible) return {}

  const position = panelStore.dragPreview.position

  switch (position) {
    case 'left':
      return {
        left: '0',
        top: `${bounds.top}px`,
        bottom: `${100 - bounds.bottom}%`,
        width: `${bounds.left + bounds.width / 2}px`
      }
    case 'right':
      return {
        left: `${bounds.left + bounds.width / 2}px`,
        top: `${bounds.top}px`,
        right: '0',
        bottom: `${100 - bounds.bottom}%`
      }
    case 'top':
      return {
        left: `${bounds.left}px`,
        top: '0',
        right: `${100 - bounds.right}%`,
        height: `${bounds.top + bounds.height / 2}px`
      }
    case 'bottom':
      return {
        left: `${bounds.left}px`,
        top: `${bounds.top + bounds.height / 2}px`,
        right: `${100 - bounds.right}%`,
        bottom: '0'
      }
    case 'center':
      return {
        left: `${bounds.left}px`,
        top: `${bounds.top}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`
      }
    default:
      return {}
  }
})
</script>

<style scoped>
.drag-preview {
  position: absolute;
  background: rgba(59, 130, 246, 0.2);
  border: 2px dashed #3b82f6;
  pointer-events: none;
  z-index: 1000;
  transition: all 0.1s ease-out;
  /* Hidden by default */
  display: none;
}

.drag-preview--visible {
  display: block;
}

.preview-center {
  background: rgba(59, 130, 246, 0.3);
  border-radius: 8px;
}
</style>
