<template>
  <splitpanes
    ref="splitpanesRef"
    v-if="panel.direction"
    :horizontal="panel.direction === 'horizontal'"
    class="custom-splitpanes"
    @resize="handleResize"
    @resized="handleResized"
    @mousedown.capture="handleMouseDownCapture"
  >
    <pane
      v-for="(child, index) in panel.children"
      :key="child.id"
      :min-size="minPaneSize"
      :size="paneSizes[index]"
    >
      <PanelRenderer
        v-if="child.children"
        :panel="child"
      />
      <TabGroup
        v-else
        :panel="child"
      />
    </pane>
  </splitpanes>
  <TabGroup
    v-else
    :panel="panel"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import TabGroup from './TabGroup.vue'
import { usePanelStore } from '@/stores/panel'
import type { Panel } from '@/stores/panel'

interface Props {
  panel: Panel
}

const props = defineProps<Props>()
const panelStore = usePanelStore()
const splitpanesRef = ref<InstanceType<typeof Splitpanes> | null>(null)
const splitpanesSize = ref({ width: 0, height: 0 })
let resizeObserver: ResizeObserver | null = null

const MIN_PANEL_WIDTH = 280
const MIN_PANEL_HEIGHT = 220

const paneSizes = computed(() => normalizePaneSizes(
  props.panel.sizes,
  props.panel.children?.length ?? 0
))

const minPaneSize = computed(() => {
  const paneCount = props.panel.children?.length ?? 1
  const size = props.panel.direction === 'horizontal'
    ? splitpanesSize.value.height
    : splitpanesSize.value.width
  const minPixels = props.panel.direction === 'horizontal'
    ? MIN_PANEL_HEIGHT
    : MIN_PANEL_WIDTH

  if (size <= 0) return 10

  return Math.min(100 / paneCount, (minPixels / size) * 100)
})

defineOptions({
  name: 'PanelRenderer'
})

function normalizePaneSizes(sizes: number[] | undefined, paneCount: number) {
  if (paneCount <= 0) return []

  const fallbackSize = 100 / paneCount
  const normalized = Array.from({ length: paneCount }, (_, index) => {
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

function syncSizes(panes: Array<{ size: number }>) {
  if (!props.panel.children?.length) return
  panelStore.updatePanelSizes(props.panel.id, panes.map(pane => pane.size))
}

function handleResize(panes: Array<{ size: number }>) {
  panelStore.setSplitterResizing(true)
  syncSizes(panes)
}

function handleResized(panes: Array<{ size: number }>) {
  syncSizes(panes)
  window.setTimeout(() => {
    panelStore.setSplitterResizing(false)
  }, 0)
}

function handleMouseDownCapture(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (target?.closest('.splitpanes__splitter')) {
    panelStore.setSplitterResizing(true)
  }
}

function stopResizeTracking() {
  panelStore.setSplitterResizing(false)
}

onMounted(() => {
  window.addEventListener('mouseup', stopResizeTracking)
  window.addEventListener('blur', stopResizeTracking)

  const element = splitpanesRef.value?.$el as HTMLElement | undefined
  if (element) {
    const rect = element.getBoundingClientRect()
    splitpanesSize.value = {
      width: rect.width,
      height: rect.height
    }
  }

  if (element && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect
      if (!rect) return

      splitpanesSize.value = {
        width: rect.width,
        height: rect.height
      }
    })
    resizeObserver.observe(element)
  }
})

onUnmounted(() => {
  window.removeEventListener('mouseup', stopResizeTracking)
  window.removeEventListener('blur', stopResizeTracking)
  resizeObserver?.disconnect()
})
</script>

<style>
.splitpanes__splitter {
  position: relative;
  background-color: transparent !important;
  z-index: 10;
}

.custom-splitpanes {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.custom-splitpanes > .splitpanes__pane {
  min-width: 0;
  min-height: 0;
}

.splitpanes__splitter:before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border-color);
  opacity: 0.6;
  transition: background-color 0.2s, opacity 0.2s;
  z-index: 1;
}

.splitpanes--vertical > .splitpanes__splitter {
  min-width: 4px;
  cursor: col-resize;
}

.splitpanes--vertical > .splitpanes__splitter:before {
  width: 1px;
  margin: 0 auto;
}

.splitpanes--horizontal > .splitpanes__splitter {
  min-height: 4px;
  cursor: row-resize;
}

.splitpanes--horizontal > .splitpanes__splitter:before {
  height: 1px;
  margin: auto 0;
}

.splitpanes__splitter:hover:before {
  background-color: var(--accent-color);
  opacity: 1;
}

.splitpanes__splitter.dragging:before,
.splitpanes--dragging > .splitpanes__splitter:before {
  background-color: var(--accent-color);
  opacity: 1;
}

.splitpanes__splitter:after {
  content: '';
  position: absolute;
  background-color: transparent;
  z-index: 2;
  transition: background-color 0.2s;
}

.splitpanes--vertical > .splitpanes__splitter:after {
  left: 50%;
  top: 0;
  bottom: 0;
  width: 8px;
  transform: translateX(-50%);
}

.splitpanes--horizontal > .splitpanes__splitter:after {
  top: 50%;
  left: 0;
  right: 0;
  height: 8px;
  transform: translateY(-50%);
}

.splitpanes__splitter:hover:after {
  background-color: rgba(0, 122, 204, 0.1);
}

.theme-light .splitpanes__splitter:before {
  background-color: #d0d0d0;
  opacity: 0.8;
}

.theme-light .splitpanes__splitter:hover:before {
  background-color: var(--accent-color);
}

.theme-dark .splitpanes__splitter:before {
  background-color: #444;
  opacity: 0.8;
}

.theme-dark .splitpanes__splitter:hover:before {
  background-color: var(--accent-color);
}
</style>
