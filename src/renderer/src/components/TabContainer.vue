<template>
  <div class="tab-container">
    <!-- 空状态 -->
    <div v-if="tabsStore.tabs.length === 0" class="empty-state">
      <p>从左侧选择一个 AI 模型开始对话</p>
    </div>

    <!-- 有标签时显示标签栏和内容 -->
    <template v-else>
      <!-- 标签栏 -->
      <div class="tab-bar">
        <div
          v-for="tab in tabsStore.tabs"
          :key="tab.id"
          :class="['tab', { active: tab.id === tabsStore.activeTabId }]"
          @click="tabsStore.activateTab(tab.id)"
        >
          <img :src="getIconPath(tab.model.icon)" class="tab-icon" @error="handleImageError" />
          <span class="tab-title">{{ tab.model.name }}</span>
          <button class="tab-close" @click.stop="tabsStore.closeTab(tab.id)">
            <el-icon :size="14"><Close /></el-icon>
          </button>
        </div>
      </div>

      <!-- 标签内容区 -->
      <div class="tab-content">
        <WebViewContainer
          v-for="tab in tabsStore.tabs"
          :key="tab.id"
          :model="tab.model"
          :visible="tab.id === tabsStore.activeTabId"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Close } from '@element-plus/icons-vue'
import { useTabsStore } from '@/stores/tabs'
import WebViewContainer from './WebViewContainer.vue'

const tabsStore = useTabsStore()

function getIconPath(icon: string) {
  return `online://${icon}`
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text y="20" font-size="20">🤖</text></svg>')
}
</script>

<style scoped>
.tab-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

/* 标签栏 */
.tab-bar {
  display: flex;
  height: 40px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid #444;
  overflow-x: auto;
  overflow-y: hidden;
  flex-shrink: 0;
}

.theme-light .tab-bar {
  border-bottom: 1px solid #bbb;
}

/* 标签 */
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
  border-top: 1px solid #666;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

.theme-light .tab {
  border-right: 1px solid #ccc;
  border-top: 1px solid #ccc;
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

/* 标签内容区 */
.tab-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}
</style>
