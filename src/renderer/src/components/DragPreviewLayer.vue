<template>
  <div
    v-if="panelStore.dragPreview.visible"
    class="drag-preview"
    :class="previewClass"
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
</script>

<style scoped>
.drag-preview {
  position: fixed;
  background: rgba(59, 130, 246, 0.2);
  border: 2px dashed #3b82f6;
  pointer-events: none;
  z-index: 1000;
  transition: all 0.15s ease-out;
}

.preview-left {
  left: 0;
  top: 0;
  bottom: 0;
  width: 50%;
}

.preview-right {
  right: 0;
  top: 0;
  bottom: 0;
  width: 50%;
}

.preview-top {
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
}

.preview-bottom {
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
}

.preview-center {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 100px;
  background: rgba(59, 130, 246, 0.3);
  border: 2px dashed #3b82f6;
  border-radius: 8px;
}
</style>
