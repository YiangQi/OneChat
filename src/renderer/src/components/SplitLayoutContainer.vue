<template>
  <div class="split-layout-container">
    <splitpanes
      class="splitpanes-root"
      @resize="handleResize"
    >
      <pane
        v-for="panel in panelStore.flatPanels"
        :key="panel.id"
        :min-size="20"
        :size="panel.size"
      >
        <div class="panel-content">
          <div class="panel-header">
            <span class="panel-title">{{ panel.id }}</span>
          </div>
          <div class="panel-body">
            <!-- Panel content will be rendered here -->
            <div class="empty-state">No tabs open</div>
          </div>
        </div>
      </pane>
    </splitpanes>
  </div>
</template>

<script setup lang="ts">
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { usePanelStore } from '@/stores/panel'

const panelStore = usePanelStore()

function handleResize(event: any) {
  // 处理面板大小调整
  // 可以在这里添加最小尺寸限制逻辑
  console.log('[SplitLayoutContainer] Resize event:', event)
}
</script>

<style scoped>
.split-layout-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: var(--bg-primary);
}

.splitpanes-root {
  width: 100%;
  height: 100%;
}

.panel-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.panel-header {
  padding: 8px 12px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
}

.panel-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.panel-body {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
  font-size: 14px;
}
</style>
