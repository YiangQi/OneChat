<template>
  <div class="layout-container">
    <!-- 空状态 -->
    <div v-if="tabsStore.tabs.length === 0" class="empty-state">
      <p>从左侧选择一个 AI 模型开始对话</p>
    </div>

    <!-- Golden Layout 容器 -->
    <div
      v-show="tabsStore.tabs.length > 0"
      ref="goldenLayoutContainer"
      class="golden-layout-container"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useTabsStore } from '@/stores/tabs'
import { useLayoutStore } from '@/stores/layout'

const tabsStore = useTabsStore()
const layoutStore = useLayoutStore()

const goldenLayoutContainer = ref<HTMLElement | null>(null)

// 初始化 Golden Layout
onMounted(() => {
  if (goldenLayoutContainer.value) {
    layoutStore.initLayout(goldenLayoutContainer.value)
  }
})

// 清理
onUnmounted(() => {
  layoutStore.destroyLayout()
})

// 监听 tabs 变化，同步到 Golden Layout
watch(
  () => tabsStore.tabs,
  (newTabs, oldTabs) => {
    // 如果有新标签，添加到布局
    if (newTabs.length > (oldTabs?.length || 0)) {
      const newTab = newTabs[newTabs.length - 1]
      if (layoutStore.isInitialized) {
        layoutStore.addTabToLayout(newTab.id, newTab)
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

/* Golden Layout 基础样式覆盖 */
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
</style>
