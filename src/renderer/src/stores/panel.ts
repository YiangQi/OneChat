import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { Tab } from './tabs'
import { useTabsStore } from './tabs'

const MAX_PANELS = 10
const MIN_PANEL_WIDTH = 280
const MIN_PANEL_HEIGHT = 220

export interface Panel {
  id: string
  tabIds: string[]
  activeTabId: string
  tabs?: Tab[]
  direction?: 'horizontal' | 'vertical'
  children?: Panel[]
  size?: number
  sizes?: number[]
}

export interface DragPreview {
  visible: boolean
  position: 'left' | 'right' | 'top' | 'bottom' | 'center' | null
  targetPanelId: string | null
  targetScope?: 'panel' | 'container'
  blocked?: boolean
  message?: string
  panelBounds?: {
    left: number
    top: number
    right: number
    bottom: number
    width: number
    height: number
  }
}

function createLeafPanel(id: string): Panel {
  return {
    id,
    tabIds: [],
    activeTabId: ''
  }
}

export const usePanelStore = defineStore('panel', () => {
  const tabsStore = useTabsStore()

  const panels = ref<Panel[]>([
    createLeafPanel('panel-default')
  ])

  const dragPreview = ref<DragPreview>({
    visible: false,
    position: null,
    targetPanelId: null,
    targetScope: 'panel'
  })

  let nextPanelSequence = 0

  const isDraggingGlobal = ref(false)
  const isResizingSplitters = ref(false)

  const tabsById = computed(() => {
    const map = new Map<string, Tab>()
    for (const tab of tabsStore.tabs) {
      map.set(tab.id, tab)
    }
    return map
  })

  const flatPanels = computed(() => {
    const result: Panel[] = []

    function flatten(panelList: Panel[]) {
      for (const panel of panelList) {
        if (panel.children?.length) {
          flatten(panel.children)
        } else {
          result.push(panel)
        }
      }
    }

    flatten(panels.value)
    return result
  })

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
    function search(panelList: Panel[]): Panel | undefined {
      for (const panel of panelList) {
        if (panel.id === panelId) return panel
        if (panel.children?.length) {
          const found = search(panel.children)
          if (found) return found
        }
      }
      return undefined
    }

    return search(panels.value)
  }

  function findParentPanel(panelId: string): Panel | undefined {
    function search(panelList: Panel[]): Panel | undefined {
      for (const panel of panelList) {
        if (!panel.children?.length) continue

        if (panel.children.some(child => child.id === panelId)) {
          return panel
        }

        const found = search(panel.children)
        if (found) return found
      }
      return undefined
    }

    return search(panels.value)
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

  function isLeafPanel(panel: Panel): boolean {
    return !panel.children?.length
  }

  function canCreateNewPanel(): boolean {
    return flatPanels.value.length < MAX_PANELS
  }

  function normalizeSizes(sizes: number[] | undefined, childCount: number): number[] {
    if (childCount <= 0) return []

    const fallbackSize = 100 / childCount
    const normalized = Array.from({ length: childCount }, (_, index) => {
      const size = sizes?.[index]
      return typeof size === 'number' && Number.isFinite(size) && size > 0
        ? size
        : fallbackSize
    })

    const total = normalized.reduce((sum, size) => sum + size, 0)
    if (total <= 0) {
      return normalized.map(() => fallbackSize)
    }

    return normalized.map(size => (size / total) * 100)
  }

  function splitSizesForNewChild(
    sizes: number[] | undefined,
    childCountBefore: number,
    targetIndex: number,
    insertIndex: number
  ): number[] {
    const baseSizes = normalizeSizes(sizes, childCountBefore)
    const targetSize = baseSizes[targetIndex] ?? (100 / (childCountBefore + 1))
    const splitSize = targetSize / 2
    const nextSizes = [...baseSizes]

    nextSizes[targetIndex] = splitSize
    nextSizes.splice(insertIndex, 0, splitSize)

    return normalizeSizes(nextSizes, childCountBefore + 1)
  }

  function createPanelId(prefix = 'panel'): string {
    return `${prefix}-${Date.now()}-${nextPanelSequence++}`
  }

  function canSplitWithinBounds(position: string, bounds?: { width: number, height: number }): boolean {
    if (!bounds) return true

    if (position === 'left' || position === 'right') {
      return bounds.width / 2 >= MIN_PANEL_WIDTH
    }

    if (position === 'top' || position === 'bottom') {
      return bounds.height / 2 >= MIN_PANEL_HEIGHT
    }

    return true
  }

  function getRootSplitDirection(position: string): 'horizontal' | 'vertical' | null {
    if (position === 'left' || position === 'right') return 'vertical'
    if (position === 'top' || position === 'bottom') return 'horizontal'
    return null
  }

  function getRootSplitInsertPosition(position: string): 'before' | 'after' | null {
    if (position === 'left' || position === 'top') return 'before'
    if (position === 'right' || position === 'bottom') return 'after'
    return null
  }

  function getContainerEdgePosition(
    clientX: number,
    clientY: number,
    rect: { left: number, top: number, width: number, height: number }
  ): 'left' | 'right' | 'top' | 'bottom' | null {
    const x = clientX - rect.left
    const y = clientY - rect.top
    const edgeWidth = Math.min(96, rect.width / 4)
    const edgeHeight = Math.min(96, rect.height / 4)

    if (x < edgeWidth) return 'left'
    if (x > rect.width - edgeWidth) return 'right'
    if (y < edgeHeight) return 'top'
    if (y > rect.height - edgeHeight) return 'bottom'

    return null
  }

  function getInsertionTargetPanel(): Panel | undefined {
    const activePanel = tabsStore.activeTabId ? findPanelContainingTab(tabsStore.activeTabId) : undefined
    return activePanel ?? findPanel('panel-default') ?? flatPanels.value[0]
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
    const leafPanels = [...flatPanels.value]
    for (const panel of leafPanels) {
      if (panel.tabIds.length > 0) continue

      const isRootDefault = panel.id === 'panel-default' && !findParentPanel(panel.id)
      if (isRootDefault) continue

      closePanel(panel.id)
    }
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
      if (targetPanel) {
        targetPanel.tabIds = [...targetPanel.tabIds, ...unassignedIds]
        if (!targetPanel.activeTabId || unassignedIds.includes(tabsStore.activeTabId)) {
          targetPanel.activeTabId = tabsStore.activeTabId || unassignedIds[unassignedIds.length - 1]
        }
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

  function replaceChild(parent: Panel, childId: string, replacement: Panel) {
    if (!parent.children) return

    const index = parent.children.findIndex(child => child.id === childId)
    if (index === -1) return

    parent.children.splice(index, 1, replacement)
  }

  function splitPanel(
    targetPanelId: string,
    position: 'before' | 'after',
    direction: 'horizontal' | 'vertical'
  ): string | null {
    if (!canCreateNewPanel()) return null

    const targetPanel = findPanel(targetPanelId)
    if (!targetPanel || !isLeafPanel(targetPanel)) return null

    const newPanel = createLeafPanel(createPanelId())
    ensureCompatTabs(targetPanel)
    ensureCompatTabs(newPanel)
    const parent = findParentPanel(targetPanelId)

    if (parent?.children) {
      if (parent.direction === direction) {
        const targetIndex = parent.children.findIndex(child => child.id === targetPanelId)
        const insertIndex = position === 'before' ? targetIndex : targetIndex + 1
        const nextSizes = splitSizesForNewChild(parent.sizes, parent.children.length, targetIndex, insertIndex)
        parent.children.splice(insertIndex, 0, newPanel)
        parent.sizes = nextSizes
      } else {
        const nestedParent: Panel = {
          id: createPanelId('panel-parent'),
          tabIds: [],
          activeTabId: '',
          direction,
          children: position === 'before'
            ? [newPanel, targetPanel]
            : [targetPanel, newPanel],
          sizes: [50, 50]
        }

        replaceChild(parent, targetPanelId, nestedParent)
      }
    } else {
      const rootIndex = panels.value.findIndex(panel => panel.id === targetPanelId)
      if (rootIndex === -1) return null

      const newParent: Panel = {
        id: createPanelId('panel-parent'),
        tabIds: [],
        activeTabId: '',
        direction,
        children: position === 'before'
          ? [newPanel, targetPanel]
          : [targetPanel, newPanel],
        sizes: [50, 50]
      }

      panels.value.splice(rootIndex, 1, newParent)
    }

    return newPanel.id
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
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    let position: DragPreview['position'] = 'center'

    if (x < rect.width / 3) {
      position = 'left'
    } else if (x > rect.width - rect.width / 3) {
      position = 'right'
    } else if (y < rect.height / 3) {
      position = 'top'
    } else if (y > rect.height - rect.height / 3) {
      position = 'bottom'
    }

    const blocked = !canSplitWithinBounds(position ?? 'center', {
      width: rect.width,
      height: rect.height
    })

    dragPreview.value = {
      visible: true,
      position,
      targetPanelId,
      targetScope: 'panel',
      blocked,
      message: blocked ? '空间太小，无法继续分屏' : undefined,
      panelBounds: {
        left: rect.left - containerRect.left,
        top: rect.top - containerRect.top,
        right: rect.right - containerRect.left,
        bottom: rect.bottom - containerRect.top,
        width: rect.width,
        height: rect.height
      }
    }
  }

  function handleContainerDragOver(e: DragEvent, rect: DOMRect) {
    e.preventDefault()

    const position = getContainerEdgePosition(e.clientX, e.clientY, rect)

    if (!position) {
      if (dragPreview.value.targetScope === 'container') {
        dragPreview.value = {
          visible: false,
          position: null,
          targetPanelId: null,
          targetScope: 'container',
          blocked: false,
          message: undefined
        }
      }
      return
    }

    const blocked = !canSplitWithinBounds(position, {
      width: rect.width,
      height: rect.height
    })

    dragPreview.value = {
      visible: true,
      position,
      targetPanelId: null,
      targetScope: 'container',
      blocked,
      message: blocked ? '空间太小，无法继续分屏' : undefined,
      panelBounds: {
        left: 0,
        top: 0,
        right: rect.width,
        bottom: rect.height,
        width: rect.width,
        height: rect.height
      }
    }
  }

  function splitRootPanel(position: 'left' | 'right' | 'top' | 'bottom'): string | null {
    if (!canCreateNewPanel()) return null

    const direction = getRootSplitDirection(position)
    const insertPosition = getRootSplitInsertPosition(position)
    if (!direction || !insertPosition) return null

    const existingRoot = panels.value[0]
    if (!existingRoot) return null

    const newPanel = createLeafPanel(createPanelId())
    ensureCompatTabs(newPanel)

    const newRoot: Panel = {
      id: createPanelId('panel-parent'),
      tabIds: [],
      activeTabId: '',
      direction,
      children: insertPosition === 'before'
        ? [newPanel, existingRoot]
        : [existingRoot, newPanel],
      sizes: [50, 50]
    }

    panels.value.splice(0, 1, newRoot)
    return newPanel.id
  }

  function handleContainerDrop(tabId: string, position: string) {
    const sourcePanel = findPanelContainingTab(tabId)
    if (!sourcePanel) return

    const splitPosition = position as 'left' | 'right' | 'top' | 'bottom'
    if (!getRootSplitDirection(splitPosition)) return

    if (!canSplitWithinBounds(position, dragPreview.value.panelBounds)) {
      dragPreview.value = {
        visible: false,
        position: null,
        targetPanelId: null,
        targetScope: 'container',
        blocked: false,
        message: undefined
      }
      isDraggingGlobal.value = false
      return
    }

    const newPanelId = splitRootPanel(splitPosition)
    if (newPanelId) {
      moveTabToPanel(tabId, sourcePanel.id, newPanelId)
    }

    dragPreview.value = {
      visible: false,
      position: null,
      targetPanelId: null,
      targetScope: 'container',
      blocked: false,
      message: undefined
    }
    isDraggingGlobal.value = false
  }

  function handleDrop(tabId: string, position: string, targetPanelId: string) {
    const targetPanel = findPanel(targetPanelId)
    const sourcePanel = findPanelContainingTab(tabId)
    if (!targetPanel || !sourcePanel) return
    if (!canSplitWithinBounds(position, dragPreview.value.panelBounds)) {
      dragPreview.value = {
        visible: false,
        position: null,
        targetPanelId: null,
        targetScope: 'panel',
        blocked: false,
        message: undefined
      }
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

    dragPreview.value = {
      visible: false,
      position: null,
      targetPanelId: null,
      targetScope: 'panel',
      blocked: false,
      message: undefined
    }
    isDraggingGlobal.value = false
  }

  function closePanel(panelId: string) {
    const panel = findPanel(panelId)
    const parent = findParentPanel(panelId)
    if (!panel || panel.children?.length || panel.tabIds.length > 0) return

    if (parent?.children) {
      parent.children = parent.children.filter(child => child.id !== panelId)

      if (parent.children.length > 0) {
        parent.sizes = normalizeSizes(parent.sizes, parent.children.length)
      } else {
        parent.sizes = []
      }

      if (parent.children.length === 1) {
        mergePanel(parent)
      }
      return
    }

    if (panel.id === 'panel-default') return

    const rootIndex = panels.value.findIndex(rootPanel => rootPanel.id === panelId)
    if (rootIndex !== -1) {
      panels.value.splice(rootIndex, 1)
    }
  }

  function mergePanel(parentPanel: Panel) {
    if (!parentPanel.children || parentPanel.children.length !== 1) return

    const onlyChild = parentPanel.children[0]
    const grandParent = findParentPanel(parentPanel.id)

    if (grandParent?.children) {
      replaceChild(grandParent, parentPanel.id, onlyChild)
      if (grandParent.children.length > 0) {
        grandParent.sizes = normalizeSizes(grandParent.sizes, grandParent.children.length)
      }
      return
    }

    const rootIndex = panels.value.findIndex(panel => panel.id === parentPanel.id)
    if (rootIndex !== -1) {
      panels.value.splice(rootIndex, 1, onlyChild)
    }
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
    panels,
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
