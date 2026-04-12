<template>
  <div
    ref="tabGroupRef"
    class="tab-group"
    :class="{ 'tab-group--drag-over': isDragOver }"
    :data-testid="`panel-${panel.id}`"
    @dragover="handleDragOver"
    @drop="handleDrop"
    @dragleave="handleDragLeave"
  >
    <div v-if="tabs.length > 0" class="tab-bar">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        :class="['tab', { active: tab.id === panel.activeTabId }]"
        :draggable="true"
        :data-testid="`tab-${tab.id}`"
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

    <div
      class="tab-content"
      :data-panel-content-id="panel.id"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { Close } from '@element-plus/icons-vue'
import { debounce } from 'lodash-es'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { usePanelStore } from '@/stores/panel'
import type { Panel } from '@/stores/panel'
import type { Tab } from '@/stores/tabs'

interface Props {
  panel: Panel
}

const props = defineProps<Props>()
const panelStore = usePanelStore()
const tabGroupRef = ref<HTMLElement>()

const tabs = computed(() => {
  const resolvedTabs = panelStore.getPanelTabs(props.panel.id)
  if (resolvedTabs.length > 0 || !props.panel.tabs) {
    return resolvedTabs
  }

  return props.panel.tabs
})

const isDragOver = computed(() => {
  return panelStore.dragPreview.visible &&
    panelStore.dragPreview.targetPanelId === props.panel.id
})

function getIconPath(icon: string) {
  return `online://${icon}`
}

function activateTab(tabId: string) {
  panelStore.activateTab(props.panel.id, tabId)
}

function closeTab(tabId: string) {
  panelStore.closeTab(props.panel.id, tabId)
}

function handleDragStart(e: DragEvent, tab: Tab) {
  if (!e.dataTransfer) return

  panelStore.isDraggingGlobal = true
  e.dataTransfer.setData('text/plain', JSON.stringify({
    tabId: tab.id,
    sourcePanelId: props.panel.id
  }))
  e.dataTransfer.effectAllowed = 'move'

  const dragImage = e.currentTarget as HTMLElement | null
  if (!dragImage) return

  const rect = dragImage.getBoundingClientRect()
  const clone = dragImage.cloneNode(true) as HTMLElement
  clone.style.position = 'absolute'
  clone.style.top = '-9999px'
  clone.style.left = '-9999px'
  clone.style.width = `${rect.width}px`
  clone.style.opacity = '0.8'
  clone.classList.add('tab-dragging')

  document.body.appendChild(clone)
  e.dataTransfer.setDragImage(clone, rect.width / 2, rect.height / 2)

  setTimeout(() => {
    clone.remove()
  }, 0)
}

const handleDragOverDebounced = debounce((e: DragEvent) => {
  if (!panelStore.isDraggingGlobal) return
  if (!tabGroupRef.value) return
  if (isOverContainerEdge(e)) return

  const rect = tabGroupRef.value.getBoundingClientRect()
  panelStore.handleDragOver(e, props.panel.id, rect)
}, 16)

function handleDragOver(e: DragEvent) {
  if (!panelStore.isDraggingGlobal) return
  if (isOverContainerEdge(e)) {
    handleDragOverDebounced.cancel()
    return
  }

  e.preventDefault()
  handleDragOverDebounced(e)
}

function isOverContainerEdge(e: DragEvent) {
  const container = document.querySelector('.split-layout-container')
  const rect = container?.getBoundingClientRect()
  if (!rect) return false

  return Boolean(panelStore.getContainerEdgePosition(e.clientX, e.clientY, rect))
}

function handleDragLeave(e: DragEvent) {
  const rect = tabGroupRef.value?.getBoundingClientRect()
  if (!rect) return

  const x = e.clientX
  const y = e.clientY
  if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
    return
  }

  hideDragPreview()
}

function hideDragPreview() {
  handleDragOverDebounced.cancel()

  if (panelStore.dragPreview.targetPanelId === props.panel.id) {
    panelStore.dragPreview = {
      visible: false,
      position: null,
      targetPanelId: null
    }
  }
}

function handleDrop(e: DragEvent) {
  if (panelStore.dragPreview.targetScope === 'container') {
    return
  }

  e.preventDefault()
  e.stopPropagation()

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
  } finally {
    cleanupDragState()
  }
}

function cleanupDragState() {
  handleDragOverDebounced.cancel()
  panelStore.isDraggingGlobal = false
  panelStore.dragPreview = {
    visible: false,
    position: null,
    targetPanelId: null
  }
}

function handleDragEnd() {
  cleanupDragState()
}

onMounted(() => {
  document.addEventListener('dragend', handleDragEnd)
})

onUnmounted(() => {
  document.removeEventListener('dragend', handleDragEnd)
  handleDragOverDebounced.cancel()
})
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
  margin-top: 1px;
  padding: 0 12px;
  min-width: 120px;
  max-width: 200px;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
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

.tab-dragging {
  opacity: 0.8;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
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

.tab-group--drag-over {
  position: relative;
}

.tab-group--drag-over::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid var(--accent-color);
  border-radius: 4px;
  pointer-events: none;
  z-index: 100;
  animation: pulse-border 1.5s ease-in-out infinite;
}

.tab-group--drag-over .tab-bar {
  background: rgba(0, 122, 204, 0.15);
}

@keyframes pulse-border {
  0%, 100% {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 0 rgba(0, 122, 204, 0.4);
  }
  50% {
    border-color: #3399ff;
    box-shadow: 0 0 0 4px rgba(0, 122, 204, 0.1);
  }
}

.theme-light .tab-group--drag-over .tab-bar {
  background: rgba(0, 122, 204, 0.1);
}

.theme-dark .tab-group--drag-over .tab-bar {
  background: rgba(0, 122, 204, 0.2);
}
</style>
