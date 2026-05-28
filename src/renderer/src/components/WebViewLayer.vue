<template>
  <div class="webview-layer">
    <WebViewContainer
      v-for="tab in tabsStore.tabs"
      :key="tab.id"
      :tab-id="tab.id"
      :model="tab.model"
      :layout="layouts[tab.id] ?? hiddenLayout"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { usePanelStore } from '@/stores/panel'
import { useTabsStore } from '@/stores/tabs'
import WebViewContainer from './WebViewContainer.vue'

const panelStore = usePanelStore()
const tabsStore = useTabsStore()

const hiddenLayout = {
  visible: false,
  left: 0,
  top: 0,
  width: 0,
  height: 0
}

const layouts = ref<Record<string, typeof hiddenLayout>>({})
let resizeObserver: ResizeObserver | null = null
const observedTargets = new Set<Element>()
let animationFrameId = 0

function scheduleLayoutUpdate(repeat = false) {
  const runUpdate = () => {
    animationFrameId = 0
    updateLayouts()

    if (repeat && typeof window !== 'undefined') {
      window.setTimeout(updateLayouts, 50)
      window.setTimeout(updateLayouts, 250)
    }
  }

  if (typeof requestAnimationFrame === 'undefined') {
    runUpdate()
    return
  }

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  animationFrameId = requestAnimationFrame(runUpdate)
}

function scheduleSingleLayoutUpdate() {
  scheduleLayoutUpdate(false)
}

async function updateLayouts() {
  await nextTick()

  const container = document.querySelector('.split-layout-container')
  const containerRect = container?.getBoundingClientRect()
  if (!containerRect) {
    layouts.value = {}
    return
  }

  const nextLayouts: Record<string, typeof hiddenLayout> = {}

  for (const tab of tabsStore.tabs) {
    const panel = panelStore.findPanelContainingTab(tab.id)
    const isActive = Boolean(panel && panel.activeTabId === tab.id)
    const target = panel
      ? document.querySelector(`[data-panel-content-id="${panel.id}"]`)
      : null
    const rect = target?.getBoundingClientRect()

    if (!isActive || !rect) {
      nextLayouts[tab.id] = hiddenLayout
      continue
    }

    nextLayouts[tab.id] = {
      visible: true,
      left: rect.left - containerRect.left,
      top: rect.top - containerRect.top,
      width: rect.width,
      height: rect.height
    }
  }

  layouts.value = nextLayouts
  refreshObservedTargets(container)
}

function refreshObservedTargets(container: Element) {
  if (!resizeObserver) return

  const targets = [
    container,
    ...document.querySelectorAll('[data-panel-content-id]')
  ]

  for (const target of targets) {
    if (observedTargets.has(target)) continue

    resizeObserver.observe(target)
    observedTargets.add(target)
  }
}

watch(
  () => ({
    tabIds: tabsStore.tabs.map(tab => tab.id),
    activeTabId: tabsStore.activeTabId,
    rootPanel: panelStore.rootPanel,
    panelState: panelStore.flatPanels.map(panel => ({
      id: panel.id,
      tabIds: [...panel.tabIds],
      activeTabId: panel.activeTabId
    }))
  }),
  () => scheduleLayoutUpdate(true),
  { deep: true, immediate: true }
)

onMounted(() => {
  const container = document.querySelector('.split-layout-container')

  if (container && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(scheduleSingleLayoutUpdate)
    refreshObservedTargets(container)
  }

  window.addEventListener('resize', scheduleSingleLayoutUpdate)
  scheduleLayoutUpdate(true)
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  resizeObserver?.disconnect()
  window.removeEventListener('resize', scheduleSingleLayoutUpdate)
})
</script>

<style scoped>
.webview-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}
</style>
