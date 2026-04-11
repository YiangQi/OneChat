<template>
  <div
    ref="tabGroupRef"
    class="tab-group"
    @dragover="handleDragOver"
    @drop="handleDrop"
    @dragleave="handleDragLeave"
  >
    <!-- 标签栏 -->
    <div v-if="panel.tabs.length > 0" class="tab-bar">
      <div
        v-for="tab in panel.tabs"
        :key="tab.id"
        :class="['tab', { active: tab.id === panel.activeTabId }]"
        :draggable="true"
        @dragstart="handleDragStart($event, tab)"
        @click="activateTab(tab.id)"
      >
        <img :src="getIconPath(tab.model.icon)" class="tab-icon" />
        <span class="tab-title">{{ tab.model.name }}</span>
        <button class="tab-close" @click.stop="closeTab(tab.id)">
          <el-icon :size="14"><Close /></el-icon>
        </button>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="tab-content">
      <WebViewContainer
        v-for="tab in panel.tabs"
        :key="tab.id"
        :model="tab.model"
        :visible="tab.id === panel.activeTabId"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Close } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { useTabsStore } from '@/stores/tabs'
import { usePanelStore } from '@/stores/panel'
import type { Panel, Tab } from '@/stores/panel'
import WebViewContainer from './WebViewContainer.vue'

interface Props {
  panel: Panel
}

const props = defineProps<Props>()
const tabsStore = useTabsStore()
const panelStore = usePanelStore()

const tabGroupRef = ref<HTMLElement>()

function getIconPath(icon: string) {
  return `online://${icon}`
}

function activateTab(tabId: string) {
  const panel = panelStore.findPanel(props.panel.id)
  if (panel) {
    panel.activeTabId = tabId
  }
}

function closeTab(tabId: string) {
  tabsStore.closeTab(tabId)

  // 检查面板是否为空，如果为空则关闭面板
  setTimeout(() => {
    const panel = panelStore.findPanel(props.panel.id)
    if (panel && panel.tabs.length === 0) {
      panelStore.closePanel(panel.id)
    }
  }, 0)
}

function handleDragStart(e: DragEvent, tab: Tab) {
  if (e.dataTransfer) {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      tabId: tab.id,
      sourcePanelId: props.panel.id
    }))
    e.dataTransfer.effectAllowed = 'move'
  }
}

function handleDragOver(e: DragEvent) {
  if (!tabGroupRef.value) return

  const rect = tabGroupRef.value.getBoundingClientRect()
  panelStore.handleDragOver(e, props.panel.id, rect)
}

function handleDragLeave() {
  // 不立即隐藏，等待可能的进入其他区域
}

function handleDrop(e: DragEvent) {
  e.preventDefault()

  try {
    const data = e.dataTransfer?.getData('text/plain')
    if (!data) return

    const { tabId } = JSON.parse(data)
    const position = panelStore.dragPreview.position

    if (position) {
      panelStore.handleDrop(tabId, position, props.panel.id)
    }
  } catch (err) {
    console.error('[TabGroup] Drop error:', err)
  }
}
</script>

<style scoped>
.tab-group {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--bg-primary);
}

.tab-bar {
  display: flex;
  height: 40px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid #444;
  overflow-x: auto;
  flex-shrink: 0;
}

.theme-light .tab-bar {
  border-bottom: 1px solid #bbb;
}

.tab {
  display: flex;
  align-items: center;
  height: 38px;
  margin-top: 2px;
  padding: 0 12px;
  min-width: 120px;
  max-width: 200px;
  background: var(--bg-tertiary);
  border-right: 1px solid #666;
  cursor: move;
  user-select: none;
  transition: background 0.2s;
}

.theme-light .tab {
  border-right: 1px solid #ccc;
}

.tab:hover {
  background: rgba(255, 255, 255, 0.05);
}

.theme-light .tab:hover {
  background: rgba(0, 0, 0, 0.05);
}

.tab.active {
  background: var(--bg-primary);
  border-bottom: 2px solid var(--accent-color);
  margin-bottom: -1px;
}

.tab-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

.tab-title {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-close {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  margin-left: 8px;
  flex-shrink: 0;
  opacity: 0;
  transition: all 0.2s;
}

.tab:hover .tab-close {
  opacity: 0.6;
}

.tab-close:hover {
  opacity: 1 !important;
  background: rgba(255, 255, 255, 0.1);
}

.theme-light .tab-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

.tab-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}
</style>
