<template>
  <div class="split-layout-container">
    <div class="splitpanes-root">
      <template v-for="panel in panelStore.panels" :key="panel.id">
        <PanelRenderer :panel="panel" />
      </template>
    </div>
    <DragPreviewLayer />
  </div>
</template>

<script setup lang="ts">
import { usePanelStore } from '@/stores/panel'
import PanelRenderer from './PanelRenderer.vue'
import DragPreviewLayer from './DragPreviewLayer.vue'

const panelStore = usePanelStore()
</script>

<style scoped>
.split-layout-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: var(--bg-primary);
  position: relative; /* 为预览层提供定位上下文 */
}

.splitpanes-root {
  width: 100%;
  height: 100%;
}
</style>
