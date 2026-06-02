import { computed } from 'vue'
import { useComposerStore } from '@/stores/composer'
import { useTabsStore } from '@/stores/tabs'
import { usePanelStore } from '@/stores/panel'
import type { Tab } from '@/stores/tabs'

export interface ComposerTarget {
  tab: Tab
  panelId: string
}

/**
 * Resolves which tabs should receive composer actions based on the target mode.
 * Returns tabs that exist and are assigned to panels.
 */
export function useComposerTargets() {
  const composerStore = useComposerStore()
  const tabsStore = useTabsStore()
  const panelStore = usePanelStore()

  /**
   * Get the target tabs based on the current target mode.
   * - 'active-tab': Returns only the active tab if it exists
   * - 'all-tabs': Returns all tabs that are assigned to panels
   */
  const targetTabs = computed<ComposerTarget[]>(() => {
    const mode = composerStore.targetMode

    if (mode === 'active-tab') {
      const activeTab = tabsStore.tabs.find(t => t.id === tabsStore.activeTabId)
      if (!activeTab) return []

      const panel = panelStore.findPanelContainingTab(activeTab.id)
      if (!panel) return []

      return [{ tab: activeTab, panelId: panel.id }]
    }

    if (mode === 'all-tabs') {
      const targets: ComposerTarget[] = []

      for (const tab of tabsStore.tabs) {
        const panel = panelStore.findPanelContainingTab(tab.id)
        if (panel) {
          targets.push({ tab, panelId: panel.id })
        }
      }

      return targets
    }

    return []
  })

  /**
   * Check if there are any valid targets for the current mode.
   */
  const hasValidTargets = computed(() => {
    return targetTabs.value.length > 0
  })

  /**
   * Get the webview element for a specific tab ID.
   * Returns null if the webview doesn't exist or isn't ready.
   */
  function getWebviewForTab(tabId: string): Electron.WebviewTag | null {
    const selector = `webview[data-tab-id="${tabId}"]`
    const webview = document.querySelector(selector) as Electron.WebviewTag | null
    return webview
  }

  /**
   * Check if a webview for a specific tab is loaded and ready.
   */
  function isWebviewReady(tabId: string): boolean {
    const webview = getWebviewForTab(tabId)
    if (!webview) return false

    return webview.getAttribute('src') !== null && webview.getAttribute('data-adapter-ready') === 'true'
  }

  /**
   * Get only the targets that have loaded and ready webviews.
   */
  const readyTargets = computed<ComposerTarget[]>(() => {
    return targetTabs.value.filter(target => isWebviewReady(target.tab.id))
  })

  return {
    targetTabs,
    hasValidTargets,
    readyTargets,
    getWebviewForTab,
    isWebviewReady
  }
}
