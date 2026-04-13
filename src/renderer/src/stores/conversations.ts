import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface WebConversation {
  id: string
  title: string
  subTitle?: string
  metadata?: Record<string, unknown>
}

interface ModelConversationState {
  conversations: WebConversation[]
  activeConversationId: string
  updatedAt: number
}

export const useConversationsStore = defineStore('conversations', () => {
  const byModelId = ref<Record<string, ModelConversationState>>({})

  const modelsWithConversations = computed(() => Object.keys(byModelId.value))

  function normalizeConversations(input: unknown): WebConversation[] {
    if (!Array.isArray(input)) return []

    const seen = new Set<string>()
    const normalized: WebConversation[] = []

    for (const item of input) {
      if (!item || typeof item !== 'object') continue

      const raw = item as Record<string, unknown>
      const id = typeof raw.id === 'string' ? raw.id.trim() : ''
      const title = typeof raw.title === 'string' ? raw.title.trim() : ''
      if (!id || !title || seen.has(id)) continue

      const conversation: WebConversation = { id, title }
      if (typeof raw.subTitle === 'string' && raw.subTitle.trim()) {
        conversation.subTitle = raw.subTitle.trim()
      }
      if (raw.metadata && typeof raw.metadata === 'object' && !Array.isArray(raw.metadata)) {
        conversation.metadata = raw.metadata as Record<string, unknown>
      }

      seen.add(id)
      normalized.push(conversation)
    }

    return normalized
  }

  function ensureModel(modelId: string): ModelConversationState {
    return byModelId.value[modelId] ?? {
      conversations: [],
      activeConversationId: '',
      updatedAt: 0
    }
  }

  function setConversations(modelId: string, input: unknown) {
    const conversations = normalizeConversations(input)
    const current = ensureModel(modelId)
    const hasActive = conversations.some(item => item.id === current.activeConversationId)

    byModelId.value[modelId] = {
      conversations,
      activeConversationId: hasActive ? current.activeConversationId : '',
      updatedAt: Date.now()
    }
  }

  function setActiveConversation(modelId: string, conversationId: unknown) {
    const current = ensureModel(modelId)
    const id = typeof conversationId === 'string' ? conversationId.trim() : ''

    if (!id) {
      byModelId.value[modelId] = {
        ...current,
        activeConversationId: '',
        updatedAt: Date.now()
      }
      return
    }

    if (!current.conversations.some(item => item.id === id)) {
      console.warn('[ConversationsStore] Ignoring unknown conversation id:', modelId, id)
      return
    }

    byModelId.value[modelId] = {
      ...current,
      activeConversationId: id,
      updatedAt: Date.now()
    }
  }

  function clearModel(modelId: string) {
    delete byModelId.value[modelId]
  }

  function getModelState(modelId: string) {
    return byModelId.value[modelId]
  }

  return {
    byModelId,
    modelsWithConversations,
    normalizeConversations,
    setConversations,
    setActiveConversation,
    clearModel,
    getModelState
  }
})
