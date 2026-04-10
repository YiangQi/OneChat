<template>
  <div class="tab-container" ref="containerRef">
    <div v-if="tabsStore.tabs.length === 0" class="empty-state">
      <p>从左侧选择一个 AI 模型开始对话</p>
    </div>
    <div v-else class="tab-content">
      <WebViewContainer
        v-for="tab in tabsStore.tabs"
        :key="tab.id"
        :model="tab.model"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTabsStore } from '@/stores/tabs'
import WebViewContainer from './WebViewContainer.vue'

const tabsStore = useTabsStore()
const containerRef = ref<HTMLElement>()
</script>

<style scoped>
.tab-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.tab-content {
  flex: 1;
  display: flex;
}
</style>
