import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useComposerStore } from '@/stores/composer'
import { useTabsStore } from '@/stores/tabs'
import { usePanelStore } from '@/stores/panel'
import { useComposerTargets } from '@/composables/useComposerTargets'
import type { AIModel } from '@shared/types'

const mockModel = (id: string): AIModel => ({
  id,
  name: id,
  url: `https://example.com/${id}`,
  icon: `${id}.png`
})

describe('ComposerStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('uses default state', () => {
    const store = useComposerStore()

    expect(store.draftText).toBe('')
    expect(store.height).toBe(store.DEFAULT_HEIGHT)
    expect(store.collapsed).toBe(false)
    expect(store.targetMode).toBe('all-tabs')
    expect(store.websiteSidebarVisible).toBe(true)
    expect(store.websiteInputVisible).toBe(true)
  })

  it('clamps composer height within bounds', () => {
    const store = useComposerStore()

    store.setHeight(store.MIN_HEIGHT - 50)
    expect(store.height).toBe(store.MIN_HEIGHT)

    store.setHeight(store.MAX_HEIGHT + 50)
    expect(store.height).toBe(store.MAX_HEIGHT)
  })

  it('persists height, collapsed state, and target mode', () => {
    let store = useComposerStore()
    store.setHeight(260)
    store.setCollapsed(true)
    store.setTargetMode('active-tab')

    setActivePinia(createPinia())
    store = useComposerStore()

    expect(store.height).toBe(260)
    expect(store.collapsed).toBe(true)
    expect(store.targetMode).toBe('active-tab')
  })

  it('keeps draft text when collapsed', () => {
    const store = useComposerStore()

    store.setDraftText('hello from composer')
    store.toggleCollapsed()
    store.toggleCollapsed()

    expect(store.draftText).toBe('hello from composer')
  })

  it('resolves active-tab and all-tabs targets', async () => {
    const tabsStore = useTabsStore()
    usePanelStore()
    const composerStore = useComposerStore()
    const targets = useComposerTargets()

    tabsStore.openTab(mockModel('chatgpt'))
    tabsStore.openTab(mockModel('claude'))
    await nextTick()

    composerStore.setTargetMode('active-tab')
    expect(targets.targetTabs.value).toHaveLength(1)
    expect(targets.targetTabs.value[0].tab.modelId).toBe('claude')

    composerStore.setTargetMode('all-tabs')
    expect(targets.targetTabs.value.map(target => target.tab.modelId)).toEqual(['chatgpt', 'claude'])
  })
})
