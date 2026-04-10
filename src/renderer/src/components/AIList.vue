<template>
  <div class="ai-list">
    <!-- 加载状态 -->
    <div v-if="aiModelsStore.models.length === 0" class="empty-state">
      <p>正在加载 AI 模型...</p>
      <p class="hint">如果长时间未加载，请检查 DevTools Console</p>
    </div>
    <!-- AI 模型列表 -->
    <div
      v-for="model in aiModelsStore.models"
      :key="model.id"
      class="ai-item"
      @click="handleClick(model)"
    >
      <img :src="getIconPath(model.icon)" :alt="model.name" class="ai-icon" @error="handleImageError" />
      <span class="ai-name">{{ model.name }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAIModelsStore } from '@/stores/aiModels'
import { useTabsStore } from '@/stores/tabs'
import type { AIModel } from '@shared/types'

const aiModelsStore = useAIModelsStore()
const tabsStore = useTabsStore()

onMounted(async () => {
  console.log('[AIList] Component mounted, loading models...')
  console.log('[AIList] window.electronAPI:', window.electronAPI)

  try {
    await aiModelsStore.loadModels()
    console.log('[AIList] Models loaded:', aiModelsStore.models.length)
    console.log('[AIList] Models:', aiModelsStore.models)
  } catch (error) {
    console.error('[AIList] Failed to load models:', error)
  }
})

function handleClick(model: AIModel) {
  console.log('[AIList] Clicked model:', model.name)
  tabsStore.openTab(model)
}

function getIconPath(icon: string) {
  // 使用自定义协议 online:// 来访问本地文件
  return `online://${icon}`
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  console.warn('[AIList] Image load error:', img.src)
  // 使用 emoji 作为备用图标
  img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text y="20" font-size="20">🤖</text></svg>')
}
</script>

<style scoped>
.ai-list {
  padding: 8px;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
}

.hint {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 8px;
}

.ai-item {
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  transition: background 0.15s ease;
  color: var(--text-primary);
  border-bottom: 1px solid var(--list-bottom-border-color);
}

.ai-item:hover {
  background: var(--accent-color);
  color: #ffffff;
  border-bottom-color: var(--accent-color);
}

.ai-item:hover .ai-name {
  color: #ffffff;
}

.ai-icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  border-radius: 4px;
  flex-shrink: 0;
}

.ai-name {
  font-size: 14px;
  color: var(--text-primary);
  flex: 1;
}
</style>
