<template>
  <div class="ai-list">
    <!-- 加载状态 -->
    <div v-if="aiModelsStore.models.length === 0" class="empty-state">
      <p>正在加载 AI 模型...</p>
      <p class="hint">如果长时间未加载，请检查 DevTools Console</p>
    </div>
    <!-- AI 模型列表 -->
    <div v-for="model in aiModelsStore.models" :key="model.id" class="ai-node">
      <div class="ai-item" @click="handleClick(model)">
        <img :src="getIconPath(model.icon)" :alt="model.name" class="ai-icon" @error="handleImageError" />
        <span class="ai-name">{{ model.name }}</span>
      </div>
      <div v-if="getVisibleConversations(model.id).length > 0" class="conversation-list">
        <button
          v-for="conversation in getVisibleConversations(model.id)"
          :key="conversation.id"
          type="button"
          class="conversation-item"
          :class="{ 'is-active': isActiveConversation(model.id, conversation.id) }"
          @click.stop="handleConversationClick(model.id, conversation)"
        >
          <span class="conversation-title">{{ conversation.title }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAIModelsStore } from '@/stores/aiModels'
import { useConversationsStore, type WebConversation } from '@/stores/conversations'
import { useTabsStore } from '@/stores/tabs'
import { useWebviewDispatch } from '@/composables/useWebviewDispatch'
import type { AIModel } from '@shared/types'

const aiModelsStore = useAIModelsStore()
const tabsStore = useTabsStore()
const conversationsStore = useConversationsStore()
const webviewDispatch = useWebviewDispatch()

onMounted(async () => {
  try {
    await aiModelsStore.loadModels()
  } catch (error) {
    console.error('[AIList] Failed to load models:', error)
  }
})

function handleClick(model: AIModel) {
  tabsStore.openTab(model)
}

function getVisibleConversations(modelId: string) {
  const isOpen = tabsStore.tabs.some(tab => tab.modelId === modelId)
  if (!isOpen) return []
  return conversationsStore.byModelId[modelId]?.conversations ?? []
}

function isActiveConversation(modelId: string, conversationId: string) {
  return conversationsStore.byModelId[modelId]?.activeConversationId === conversationId
}

function handleConversationClick(modelId: string, conversation: WebConversation) {
  const tab = tabsStore.tabs.find(item => item.modelId === modelId)
  if (!tab) {
    console.warn('[AIList] Cannot dispatch conversation click without an open tab:', modelId, conversation.id)
    return
  }

  const dispatched = webviewDispatch.dispatchConversationClicked(tab.id, conversation.id, conversation.title)
  if (!dispatched) {
    console.warn('[AIList] Failed to dispatch conversation click:', modelId, conversation.id)
  }
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

.conversation-list {
  padding: 4px 0 6px 20px;
  background: #efefef;
}

.conversation-item {
  display: block;
  width: 100%;
  min-height: 32px;
  padding: 6px 8px;
  border: 0;
  border-left: 2px solid transparent;
  border-bottom: 1px solid var(--list-bottom-border-color);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  text-align: left;
}

.conversation-item:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.conversation-item.is-active {
  border-left-color: var(--accent-color);
  color: var(--accent-color);
  background: var(--active-bg);
}

.conversation-title,
.conversation-subtitle {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-title {
  font-size: 13px;
}

.conversation-subtitle {
  margin-top: 2px;
  font-size: 11px;
  opacity: 0.72;
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
