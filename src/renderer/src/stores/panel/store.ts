import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { Tab } from '../tabs'
import { useTabsStore } from '../tabs'
import { INITIAL_PANEL_ID, MAX_PANELS } from './constants'
import { createLeafPanel, type DragPreview, type Panel } from './types'
import {
  findPanelInTree,
  findParentPanelInTree,
  flattenLeafPanels,
} from './tree'
import {
  canSplitWithinBounds,
  getContainerEdgePosition,
  normalizeSizes,
} from './layout'
import {
  createContainerDragPreview,
  createHiddenDragPreview,
  createPanelDragPreview
} from './drag'
import {
  cleanupEmptyPanels as cleanupEmptyPanelsInTree,
  closePanelInTree,
  mergeSingleChildPanel
} from './cleanup'
import {
  splitPanelInTree,
  splitRootPanel as splitRootPanelInTree
} from './split'

export type { DragPreview, Panel } from './types'

export const usePanelStore = defineStore('panel', () => {
  const tabsStore = useTabsStore()

  const rootPanel = ref<Panel>(createLeafPanel(INITIAL_PANEL_ID))
  const dragPreview = ref<DragPreview>(createHiddenDragPreview('panel'))
  const isDraggingGlobal = ref(false)
  const isResizingSplitters = ref(false)

  let nextPanelSequence = 0

  const tabsById = computed(() => {
    const map = new Map<string, Tab>()
    for (const tab of tabsStore.tabs) {
      map.set(tab.id, tab)
    }
    return map
  })

  const flatPanels = computed(() => flattenLeafPanels(rootPanel.value))

  function ensureCompatTabs(panel: Panel) {
    if (Object.prototype.hasOwnProperty.call(panel, 'tabs')) return

    Object.defineProperty(panel, 'tabs', {
      enumerable: false,
      configurable: true,
      get: () => getPanelTabs(panel),
      set: (value: Tab[] | undefined) => {
        panel.tabIds = Array.isArray(value) ? value.map(tab => tab.id) : []
        panel.activeTabId = panel.tabIds.includes(panel.activeTabId) ? panel.activeTabId : (panel.tabIds[0] ?? '')
      }
    })
  }

  function findPanel(panelId: string): Panel | undefined {
    return findPanelInTree(rootPanel.value, panelId)
  }

  function findParentPanel(panelId: string): Panel | undefined {
    return findParentPanelInTree(rootPanel.value, panelId)
  }

  function findPanelContainingTab(tabId: string): Panel | undefined {
    return flatPanels.value.find(panel => panel.tabIds.includes(tabId))
  }

  function getPanelTabs(panelOrId: string | Panel): Tab[] {
    const panel = typeof panelOrId === 'string' ? findPanel(panelOrId) : panelOrId
    if (!panel) return []

    ensureCompatTabs(panel)

    return panel.tabIds
      .map(tabId => tabsById.value.get(tabId))
      .filter((tab): tab is Tab => Boolean(tab))
  }

  function canCreateNewPanel(): boolean {
    return flatPanels.value.length < MAX_PANELS
  }

  function createPanelId(prefix = 'panel'): string {
    return `${prefix}-${Date.now()}-${nextPanelSequence++}`
  }

  function getInsertionTargetPanel(): Panel {
    const activePanel = tabsStore.activeTabId ? findPanelContainingTab(tabsStore.activeTabId) : undefined
    return activePanel ?? flatPanels.value[0] ?? rootPanel.value
  }

  function normalizeLeafPanel(panel: Panel) {
    ensureCompatTabs(panel)

    const validIds = panel.tabIds.filter(tabId => tabsById.value.has(tabId))
    if (validIds.length !== panel.tabIds.length) {
      panel.tabIds = validIds
    }

    if (panel.activeTabId && !panel.tabIds.includes(panel.activeTabId)) {
      panel.activeTabId = panel.tabIds[0] ?? ''
    }
  }

  function cleanupEmptyPanels() {
    cleanupEmptyPanelsInTree({
      rootPanel: rootPanel.value,
      flatPanels: flatPanels.value,
      findParentPanel,
      closePanel
    })
  }

  function syncWithTabsStore() {
    for (const panel of flatPanels.value) {
      normalizeLeafPanel(panel)
    }

    const assignedIds = new Set(flatPanels.value.flatMap(panel => panel.tabIds))
    const unassignedIds = tabsStore.tabs
      .map(tab => tab.id)
      .filter(tabId => !assignedIds.has(tabId))

    if (unassignedIds.length > 0) {
      const targetPanel = getInsertionTargetPanel()
      targetPanel.tabIds = [...targetPanel.tabIds, ...unassignedIds]
      if (!targetPanel.activeTabId || unassignedIds.includes(tabsStore.activeTabId)) {
        targetPanel.activeTabId = tabsStore.activeTabId || unassignedIds[unassignedIds.length - 1]
      }
    }

    if (tabsStore.activeTabId) {
      const activePanel = findPanelContainingTab(tabsStore.activeTabId)
      if (activePanel) {
        activePanel.activeTabId = tabsStore.activeTabId
      }
    }

    cleanupEmptyPanels()
  }

  function splitPanel(
    targetPanelId: string,
    position: 'before' | 'after',
    direction: 'horizontal' | 'vertical'
  ): string | null {
    return splitPanelInTree({
      targetPanelId,
      position,
      direction,
      rootPanel: rootPanel.value,
      canCreateNewPanel,
      createPanelId,
      ensureCompatTabs,
      findPanel,
      findParentPanel,
      setRootPanel: (panel) => { rootPanel.value = panel }
    })
  }

  function updatePanelSizes(panelId: string, sizes: number[]) {
    const panel = findPanel(panelId)
    if (!panel || !panel.children?.length) return

    panel.sizes = normalizeSizes(sizes, panel.children.length)
  }

  function setSplitterResizing(value: boolean) {
    isResizingSplitters.value = value
  }

  function activateTab(panelId: string, tabId: string) {
    const panel = findPanel(panelId)
    if (!panel || !panel.tabIds.includes(tabId)) return

    panel.activeTabId = tabId
    tabsStore.activateTab(tabId)
  }

  function closeTab(panelId: string, tabId: string) {
    const panel = findPanel(panelId)
    if (!panel || !panel.tabIds.includes(tabId)) return

    tabsStore.closeTab(tabId)
    syncWithTabsStore()

    const nextPanel = findPanel(panelId)
    if (nextPanel && nextPanel.activeTabId) {
      tabsStore.activateTab(nextPanel.activeTabId)
    }
  }

  function moveTabToPanel(tabId: string, sourcePanelId: string, targetPanelId: string) {
    const sourcePanel = findPanel(sourcePanelId)
    const targetPanel = findPanel(targetPanelId)

    if (!sourcePanel || !targetPanel || sourcePanelId === targetPanelId) return
    if (!sourcePanel.tabIds.includes(tabId) || targetPanel.tabIds.includes(tabId)) return

    sourcePanel.tabIds = sourcePanel.tabIds.filter(id => id !== tabId)
    if (sourcePanel.activeTabId === tabId) {
      sourcePanel.activeTabId = sourcePanel.tabIds[0] ?? ''
    }

    targetPanel.tabIds = [...targetPanel.tabIds, tabId]
    targetPanel.activeTabId = tabId
    tabsStore.activateTab(tabId)

    if (sourcePanel.tabIds.length === 0) {
      closePanel(sourcePanelId)
    }
  }

  function handleDragOver(e: DragEvent, targetPanelId: string, rect: DOMRect) {
    e.preventDefault()

    const container = document.querySelector('.split-layout-container')
    const containerRect = container?.getBoundingClientRect() ?? {
      left: 0,
      top: 0
    }

    dragPreview.value = createPanelDragPreview(e, targetPanelId, rect, containerRect)
  }

  function handleContainerDragOver(e: DragEvent, rect: DOMRect) {
    e.preventDefault()

    const position = getContainerEdgePosition(e.clientX, e.clientY, rect)
    if (!position) {
      if (dragPreview.value.targetScope === 'container') {
        dragPreview.value = createHiddenDragPreview('container')
      }
      return
    }

    dragPreview.value = createContainerDragPreview(position, rect)
  }

  function splitRootPanel(position: 'left' | 'right' | 'top' | 'bottom'): string | null {
    return splitRootPanelInTree({
      position,
      rootPanel: rootPanel.value,
      canCreateNewPanel,
      createPanelId,
      ensureCompatTabs,
      setRootPanel: (panel) => { rootPanel.value = panel }
    })
  }

  function handleContainerDrop(tabId: string, position: string) {
    const sourcePanel = findPanelContainingTab(tabId)
    if (!sourcePanel) return

    const splitPosition = position as 'left' | 'right' | 'top' | 'bottom'
    if (!['left', 'right', 'top', 'bottom'].includes(splitPosition)) return

    if (!canSplitWithinBounds(position, dragPreview.value.panelBounds)) {
      dragPreview.value = createHiddenDragPreview('container')
      isDraggingGlobal.value = false
      return
    }

    const newPanelId = splitRootPanel(splitPosition)
    if (newPanelId) {
      moveTabToPanel(tabId, sourcePanel.id, newPanelId)
    }

    dragPreview.value = createHiddenDragPreview('container')
    isDraggingGlobal.value = false
  }

  function handleDrop(tabId: string, position: string, targetPanelId: string) {
    const targetPanel = findPanel(targetPanelId)
    const sourcePanel = findPanelContainingTab(tabId)
    if (!targetPanel || !sourcePanel) return

    if (!canSplitWithinBounds(position, dragPreview.value.panelBounds)) {
      dragPreview.value = createHiddenDragPreview('panel')
      isDraggingGlobal.value = false
      return
    }

    switch (position) {
      case 'left': {
        const newPanelId = splitPanel(targetPanelId, 'before', 'vertical')
        if (newPanelId) moveTabToPanel(tabId, sourcePanel.id, newPanelId)
        break
      }
      case 'right': {
        const newPanelId = splitPanel(targetPanelId, 'after', 'vertical')
        if (newPanelId) moveTabToPanel(tabId, sourcePanel.id, newPanelId)
        break
      }
      case 'top': {
        const newPanelId = splitPanel(targetPanelId, 'before', 'horizontal')
        if (newPanelId) moveTabToPanel(tabId, sourcePanel.id, newPanelId)
        break
      }
      case 'bottom': {
        const newPanelId = splitPanel(targetPanelId, 'after', 'horizontal')
        if (newPanelId) moveTabToPanel(tabId, sourcePanel.id, newPanelId)
        break
      }
      case 'center':
        if (sourcePanel.id !== targetPanelId) {
          moveTabToPanel(tabId, sourcePanel.id, targetPanelId)
        }
        break
      default:
        break
    }

    dragPreview.value = createHiddenDragPreview('panel')
    isDraggingGlobal.value = false
  }

  function closePanel(panelId: string) {
    closePanelInTree({
      panelId,
      rootPanel: rootPanel.value,
      findPanel,
      findParentPanel,
      mergePanel
    })
  }

  function mergePanel(parentPanel: Panel) {
    mergeSingleChildPanel({
      parentPanel,
      rootPanel: rootPanel.value,
      findParentPanel,
      setRootPanel: (panel) => { rootPanel.value = panel }
    })
  }

  watch(
    () => ({
      tabIds: tabsStore.tabs.map(tab => tab.id),
      activeTabId: tabsStore.activeTabId
    }),
    () => {
      syncWithTabsStore()
    },
    { deep: true, immediate: true }
  )

  return {
    rootPanel,
    dragPreview,
    isDraggingGlobal,
    isResizingSplitters,
    flatPanels,
    findPanel,
    findParentPanel,
    findPanelContainingTab,
    getPanelTabs,
    activateTab,
    closeTab,
    splitPanel,
    updatePanelSizes,
    setSplitterResizing,
    canCreateNewPanel,
    canSplitWithinBounds,
    getContainerEdgePosition,
    handleDragOver,
    handleContainerDragOver,
    moveTabToPanel,
    handleDrop,
    handleContainerDrop,
    closePanel,
    mergePanel
  }
})
