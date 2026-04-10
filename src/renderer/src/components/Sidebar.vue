<template>
  <div class="sidebar-container" :style="{ width: sidebarWidth + 'px' }">
    <div class="sidebar" v-if="activeModule === 'ai'">
      <AIList />
    </div>
    <div
      class="resize-handle"
      @mousedown="startResize"
      :class="{ resizing: isResizing }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AIList from './AIList.vue'

defineProps<{
  activeModule: string
}>()

const DEFAULT_WIDTH = 250
const MIN_WIDTH = 180
const MAX_WIDTH = 500

const sidebarWidth = ref(DEFAULT_WIDTH)
const isResizing = ref(false)

onMounted(() => {
  // 从 localStorage 读取保存的宽度
  const saved = localStorage.getItem('sidebar-width')
  if (saved) {
    const width = parseInt(saved, 10)
    if (width >= MIN_WIDTH && width <= MAX_WIDTH) {
      sidebarWidth.value = width
    }
  }
})

function startResize(e: MouseEvent) {
  e.preventDefault() // 防止选中文本
  isResizing.value = true
  const startX = e.clientX
  const startWidth = sidebarWidth.value

  // 禁用所有 webview 的交互
  const webviews = document.querySelectorAll('webview')
  webviews.forEach(wv => {
    (wv as any).style.pointerEvents = 'none'
  })

  function onMouseMove(e: MouseEvent) {
    const deltaX = e.clientX - startX
    const newWidth = startWidth + deltaX

    if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
      sidebarWidth.value = newWidth
    }
  }

  function onMouseUp() {
    isResizing.value = false
    // 恢复 webview 的交互
    const webviews = document.querySelectorAll('webview')
    webviews.forEach(wv => {
      (wv as any).style.pointerEvents = 'auto'
    })
    // 保存宽度到 localStorage
    localStorage.setItem('sidebar-width', sidebarWidth.value.toString())
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>

<style scoped>
.sidebar-container {
  display: flex;
  height: 100%;
  position: relative;
  flex-shrink: 0;
}

.sidebar {
  flex: 1;
  height: 100%;
  background: #252526;
  border-right: 1px solid #444;
  overflow-y: auto;
  overflow-x: hidden;
  user-select: none;
}

/* 浅色主题 */
.theme-light .sidebar {
  background: #f3f3f3;
  border-right: 1px solid #bbb;
}

.resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  background: transparent;
  z-index: 9999;
  margin-right: -3px;
  pointer-events: auto;
}

/* 默认显示一条细线 */
.resize-handle::before {
  content: '';
  position: absolute;
  right: 2px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: currentColor;
  opacity: 0.15;
  pointer-events: none;
}

.resize-handle:hover {
  background: var(--accent-color);
  width: 4px;
  margin-right: 0;
}

.resize-handle:hover::before {
  opacity: 0;
}

.resize-handle.resizing {
  background: var(--accent-color);
  width: 4px;
  margin-right: 0;
}

.resize-handle.resizing::before {
  opacity: 0;
}
</style>
