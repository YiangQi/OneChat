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
import { ref, onMounted, onUnmounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { createApp } from 'vue'
import { useTabsStore } from '@/stores/tabs'
import { useLayoutStore } from '@/stores/layout'
import GoldenLayoutWebView from './GoldenLayoutWebView.vue'

const tabsStore = useTabsStore()
const layoutStore = useLayoutStore()

const goldenLayoutContainer = ref<HTMLElement | null>(null)
const isDragging = ref(false)
let rafId: number | null = null
const vueInstances = new Map<any, { app: any; wrapper: HTMLElement }>()

// 初始化 Golden Layout
onMounted(() => {
  if (goldenLayoutContainer.value) {
    layoutStore.initLayout(goldenLayoutContainer.value)

    // 等待 GL 实例创建后立即注册组件（在 init 之前）
    nextTick(() => {
      const checkInstance = setInterval(() => {
        if (layoutStore.goldenLayout) {
          clearInterval(checkInstance)

          // 使用 registerComponent 注册 Vue 3 组件
          // 注意：虽然这个 API 被标记为废弃，但它对 Vue 3 更可靠
          layoutStore.goldenLayout.registerComponent(
            'webview-container',
            (container: any, componentState: any) => {
              console.log('[LayoutContainer] Creating webview container', componentState)

              const wrapper = document.createElement('div')
              wrapper.className = 'gl-webview-wrapper'

              const app = createApp(GoldenLayoutWebView, {
                tabId: componentState.tabId,
                tabData: componentState.tabData
              })

              app.mount(wrapper)

              // 保存引用以便清理
              vueInstances.set(container, { app, wrapper })

              // 返回容器元素
              return wrapper
            }
          )

          console.log('[LayoutContainer] Registered component BEFORE init')

          // 注册完组件后调用 init()
          layoutStore.callInit()

          // 设置拖拽监听器
          setupDragListeners()
        }
      }, 100)

      setTimeout(() => clearInterval(checkInstance), 5000)
    })
  }
})

// 设置拖拽监听器
function setupDragListeners() {
  const gl = layoutStore.goldenLayout
  if (!gl) return

  // 使用 requestAnimationFrame 优化拖拽性能
  let dragStartTime = 0

  gl.on('itemDragStart', () => {
    dragStartTime = performance.now()
    isDragging.value = true

    // 取消之前的 raf
    if (rafId) {
      cancelAnimationFrame(rafId)
    }
  })

  gl.on('itemDropped', () => {
    const dragEndTime = performance.now()
    console.log(`[LayoutContainer] Drag duration: ${dragEndTime - dragStartTime}ms`)

    isDragging.value = false
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  })
}

// 清理
onBeforeUnmount(() => {
  // 清理所有 Vue 组件实例
  vueInstances.forEach(({ app, wrapper }) => {
    app.unmount()
    wrapper.remove()
  })
  vueInstances.clear()

  if (rafId) {
    cancelAnimationFrame(rafId)
  }
  layoutStore.destroyLayout()
})

onUnmounted(() => {
  // 额外的清理，确保布局被销毁
  if (layoutStore.goldenLayout) {
    layoutStore.destroyLayout()
  }
})

// 用于跟踪已处理的 tab ID
const processedTabIds = ref<Set<string>>(new Set())

// 监听 tabs 变化，同步到 Golden Layout
watch(
  () => tabsStore.tabs,
  (newTabs) => {
    console.log('[LayoutContainer] tabs changed:', newTabs.length)

    if (!layoutStore.goldenLayout || !layoutStore.isInitialized) {
      console.warn('[LayoutContainer] Golden Layout not ready')
      return
    }

    // 找到未处理的新标签
    for (const tab of newTabs) {
      if (!processedTabIds.value.has(tab.id)) {
        console.log('[LayoutContainer] Adding new tab to layout:', tab.id, tab.model?.name)
        processedTabIds.value.add(tab.id)

        // 使用 rAF 优化布局更新
        rafId = requestAnimationFrame(() => {
          layoutStore.addTabToLayout(tab.id, tab)
          rafId = null
        })
      }
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
