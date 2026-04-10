<template>
  <div class="layout-container">
    <!-- 错误状态 -->
    <div v-if="layoutStore.error" class="error-state">
      <p>布局系统错误: {{ layoutStore.error }}</p>
      <button @click="layoutStore.clearError()" class="retry-button">重试</button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="tabsStore.tabs.length === 0" class="empty-state">
      <p>从左侧选择一个 AI 模型开始对话</p>
    </div>

    <!-- Golden Layout 容器 -->
    <div
      v-show="tabsStore.tabs.length > 0"
      ref="goldenLayoutContainer"
      class="golden-layout-container"
      :class="{ 'is-dragging': isDragging }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useTabsStore } from '@/stores/tabs'
import { useLayoutStore } from '@/stores/layout'
import GoldenLayoutWebView from './GoldenLayoutWebView.vue'

const tabsStore = useTabsStore()
const layoutStore = useLayoutStore()

const goldenLayoutContainer = ref<HTMLElement | null>(null)
const isDragging = ref(false)

// 初始化 Golden Layout
onMounted(() => {
  if (goldenLayoutContainer.value) {
    layoutStore.initLayout(goldenLayoutContainer.value)

    // 等待 GL 初始化后注册组件
    nextTick(() => {
      // 监听初始化完成
      const checkInit = setInterval(() => {
        if (layoutStore.goldenLayout && layoutStore.isInitialized) {
          clearInterval(checkInit)
          // 注册 WebView 容器组件
          layoutStore.goldenLayout.registerComponent(
            'webview-container',
            GoldenLayoutWebView
          )

          // 监听拖拽事件
          setupDragListeners()

          console.log('[LayoutContainer] Registered component and drag listeners')
        }
      }, 100)

      // 5秒后停止检查
      setTimeout(() => clearInterval(checkInit), 5000)
    })
  }
})

// 设置拖拽监听器
function setupDragListeners() {
  const gl = layoutStore.goldenLayout
  if (!gl) return

  // 拖拽开始
  gl.on('itemDropped', () => {
    console.log('[LayoutContainer] Item dropped')
    isDragging.value = false
  })

  // 监听拖拽悬停
  // 注意：Golden Layout 的具体事件可能需要根据实际 API 调整
}

// 清理
onUnmounted(() => {
  layoutStore.destroyLayout()
})

// 监听 tabs 变化，同步到 Golden Layout
watch(
  () => tabsStore.tabs,
  (newTabs, oldTabs) => {
    if (!layoutStore.goldenLayout || !layoutStore.isInitialized) return

    // 如果有新标签，添加到布局
    if (newTabs.length > (oldTabs?.length || 0)) {
      const newTab = newTabs[newTabs.length - 1]
      layoutStore.addTabToLayout(newTab.id, newTab)
    }
  },
  { deep: true }
)
</script>

<style scoped>
.layout-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
}

.error-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ff4444;
  gap: 16px;
}

.retry-button {
  padding: 8px 16px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-button:hover {
  opacity: 0.9;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.golden-layout-container {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 拖拽状态 */
.is-dragging {
  opacity: 0.95;
}

/* Golden Layout 样式覆盖 */
:deep(.lm_goldenlayout) {
  width: 100%;
  height: 100%;
}

:deep(.lm_content) {
  background: var(--bg-primary);
}

:deep(.lm_stack) {
  background: var(--bg-secondary);
}

:deep(.lm_header) {
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

/* 拖拽高亮样式 */
:deep(.lm_drop_target_indicator) {
  background: var(--accent-color) !important;
  opacity: 0.3;
}

:deep(.lm_dragging) {
  opacity: 0.8;
}

/* Splitter 样式 */
:deep(.lm_splitter) {
  background: transparent;
  transition: background 0.2s;
}

:deep(.lm_splitter:hover) {
  background: var(--accent-color);
}

:deep(.lm_splitter.lm_dragging) {
  background: var(--accent-color);
  opacity: 0.8;
}
</style>
