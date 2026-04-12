<template>
  <div
    class="drag-preview"
    :class="[previewClass, {
      'drag-preview--visible': panelStore.dragPreview.visible,
      'drag-preview--blocked': panelStore.dragPreview.blocked
    }]"
    :style="previewStyle"
  >
    <span
      v-if="panelStore.dragPreview.blocked && panelStore.dragPreview.message"
      class="drag-preview-message"
    >
      {{ panelStore.dragPreview.message }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePanelStore } from '@/stores/panel'

const panelStore = usePanelStore()

const previewClass = computed(() => {
  const position = panelStore.dragPreview.position
  return position ? `preview-${position}` : ''
})

const previewStyle = computed(() => {
  const bounds = panelStore.dragPreview.panelBounds
  if (!bounds || !panelStore.dragPreview.visible) return {}

  switch (panelStore.dragPreview.position) {
    case 'left':
      return {
        left: `${bounds.left}px`,
        top: `${bounds.top}px`,
        width: `${bounds.width / 2}px`,
        height: `${bounds.height}px`
      }
    case 'right':
      return {
        left: `${bounds.left + bounds.width / 2}px`,
        top: `${bounds.top}px`,
        width: `${bounds.width / 2}px`,
        height: `${bounds.height}px`
      }
    case 'top':
      return {
        left: `${bounds.left}px`,
        top: `${bounds.top}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height / 2}px`
      }
    case 'bottom':
      return {
        left: `${bounds.left}px`,
        top: `${bounds.top + bounds.height / 2}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height / 2}px`
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
  display: none;
  box-sizing: border-box;
}

.drag-preview--visible {
  display: block;
}

.preview-center {
  background: rgba(59, 130, 246, 0.28);
  border-radius: 8px;
}

.drag-preview--blocked {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.14);
  border-color: #ef4444;
  border-style: solid;
}

.drag-preview-message {
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.85);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
}
</style>
