import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'composer-state'

const MIN_HEIGHT = 120
const MAX_HEIGHT = 400
const DEFAULT_HEIGHT = 180

export type ComposerTargetMode = 'active-tab' | 'all-tabs'

export interface ComposerState {
  height: number
  collapsed: boolean
  targetMode: ComposerTargetMode
  websiteSidebarVisible: boolean
  websiteInputVisible: boolean
}

export interface PersistedComposerState {
  height?: number
  collapsed?: boolean
  targetMode?: ComposerTargetMode
}

export const useComposerStore = defineStore('composer', () => {
  // State
  const draftText = ref('')
  const height = ref(DEFAULT_HEIGHT)
  const collapsed = ref(false)
  const targetMode = ref<ComposerTargetMode>('all-tabs')
  const websiteSidebarVisible = ref(true)
  const websiteInputVisible = ref(true)

  // Load persisted state on initialization
  function loadPersistedState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: PersistedComposerState = JSON.parse(stored)

        // Restore height with validation
        if (typeof parsed.height === 'number') {
          height.value = validateHeight(parsed.height)
        }

        // Restore collapsed state
        if (typeof parsed.collapsed === 'boolean') {
          collapsed.value = parsed.collapsed
        }

        if (parsed.targetMode === 'active-tab' || parsed.targetMode === 'all-tabs') {
          targetMode.value = parsed.targetMode
        }
      }
    } catch (error) {
      console.warn('[ComposerStore] Failed to load persisted state:', error)
    }
  }

  // Validate height is within bounds
  function validateHeight(h: number): number {
    return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, h))
  }

  // Persist state to localStorage
  function persistState() {
    try {
      const state: PersistedComposerState = {
        height: height.value,
        collapsed: collapsed.value,
        targetMode: targetMode.value
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.warn('[ComposerStore] Failed to persist state:', error)
    }
  }

  // Actions
  function setDraftText(text: string) {
    draftText.value = text
  }

  function setHeight(newHeight: number) {
    height.value = validateHeight(newHeight)
    persistState()
  }

  function setCollapsed(value: boolean) {
    collapsed.value = value
    persistState()
  }

  function toggleCollapsed() {
    collapsed.value = !collapsed.value
    persistState()
  }

  function setTargetMode(mode: ComposerTargetMode) {
    targetMode.value = mode
    persistState()
  }

  function setWebsiteSidebarVisible(visible: boolean) {
    websiteSidebarVisible.value = visible
  }

  function setWebsiteInputVisible(visible: boolean) {
    websiteInputVisible.value = visible
  }

  function clearDraft() {
    draftText.value = ''
  }

  // Auto-persist when height or collapsed state changes
  watch([height, collapsed, targetMode], () => {
    persistState()
  })

  // Initialize persisted state
  loadPersistedState()

  return {
    // State
    draftText,
    height,
    collapsed,
    targetMode,
    websiteSidebarVisible,
    websiteInputVisible,

    // Constants
    MIN_HEIGHT,
    MAX_HEIGHT,
    DEFAULT_HEIGHT,

    // Actions
    setDraftText,
    setHeight,
    setCollapsed,
    toggleCollapsed,
    setTargetMode,
    setWebsiteSidebarVisible,
    setWebsiteInputVisible,
    clearDraft,
    validateHeight
  }
})
