<template>
  <div
    ref="tabGroupRef"
    class="tab-group"
    :data-testid="`panel-${panel.id}`"
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
import { debounce } from 'lodash-es'
import { onMounted, onUnmounted, ref } from 'vue'
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
  // 先从当前面板的 tabs 数组中移除标签页
  const panel = panelStore.findPanel(props.panel.id)
  if (panel) {
    const tabIndex = panel.tabs.findIndex(t => t.id === tabId)
    if (tabIndex !== -1) {
      panel.tabs.splice(tabIndex, 1)
    }

    // 如果没有激活标签页了，清空 activeTabId
    if (panel.activeTabId === tabId) {
      panel.activeTabId = panel.tabs[0]?.id || ''
    }

    // 检查面板是否为空，如果为空则关闭面板
    if (panel.tabs.length === 0) {
      panelStore.closePanel(panel.id)
    }
  }

  // 然后从 tabsStore 中移除
  tabsStore.closeTab(tabId)
}

function handleDragStart(e: DragEvent, tab: Tab) {
  if (e.dataTransfer) {
    // 设置全局拖拽状态 - 禁用所有 webview 的 pointer-events
    panelStore.isDraggingGlobal = true

    e.dataTransfer.setData('text/plain', JSON.stringify({
      tabId: tab.id,
      sourcePanelId: props.panel.id
    }))
    e.dataTransfer.effectAllowed = 'move'

    // 创建自定义的拖拽图像（幽灵元素）
    const dragImage = e.target as HTMLElement
    if (dragImage) {
      const rect = dragImage.getBoundingClientRect()

      // 创建克隆元素作为拖拽图像
      const clone = dragImage.cloneNode(true) as HTMLElement
      clone.style.position = 'absolute'
      clone.style.top = '-9999px'
      clone.style.left = '-9999px'
      clone.style.width = `${rect.width}px`
      clone.style.opacity = '0.8'
      clone.classList.add('tab-dragging')

      document.body.appendChild(clone)

      // 设置自定义拖拽图像
      e.dataTransfer.setDragImage(clone, rect.width / 2, rect.height / 2)

      // 延迟移除克隆元素
      setTimeout(() => {
        document.body.removeChild(clone)
      }, 0)
    }
  }
}

const handleDragOverDebounced = debounce((e: DragEvent) => {
  if (!tabGroupRef.value) return
  const rect = tabGroupRef.value.getBoundingClientRect()
  panelStore.handleDragOver(e, props.panel.id, rect)
}, 16) // 约 60fps

function handleDragOver(e: DragEvent) {
  e.preventDefault() // 允许放置
  handleDragOverDebounced(e)
}

function handleDragLeave(e: DragEvent) {
  // 检查是否真的离开了元素（而不是进入子元素）
  const rect = tabGroupRef.value?.getBoundingClientRect()
  if (!rect) return

  const x = e.clientX
  const y = e.clientY

  // 如果鼠标在元素边界内，说明是进入了子元素，不应该隐藏预览
  if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
    return
  }

  // 真正离开了元素，隐藏预览
  panelStore.dragPreview = {
    visible: false,
    position: null,
    targetPanelId: null
  }
}

function handleDrop(e: DragEvent) {
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

    // 清除全局拖拽状态
    panelStore.isDraggingGlobal = false

    // 隐藏预览
    panelStore.dragPreview = {
      visible: false,
      position: null,
      targetPanelId: null
    }
  } catch (err) {
    console.error('[TabGroup] Drop error:', err)
    // 确保在错误情况下也清除拖拽状态
    panelStore.isDraggingGlobal = false
  }
}

// 全局拖拽结束处理，确保预览层被清除
function handleDragEnd() {
  // 清除全局拖拽状态 - 恢复 webview 的 pointer-events
  panelStore.isDraggingGlobal = false

  panelStore.dragPreview = {
    visible: false,
    position: null,
    targetPanelId: null
  }
}

onMounted(() => {
  document.addEventListener('dragend', handleDragEnd)
})

onUnmounted(() => {
  document.removeEventListener('dragend', handleDragEnd)
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
</style>
