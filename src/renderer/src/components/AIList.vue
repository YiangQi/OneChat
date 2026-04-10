<template>
  <div class="ai-list">
    <div
      v-for="model in aiModelsStore.models"
      :key="model.id"
      class="ai-item"
      @click="handleClick(model)"
    >
      <img :src="getIconPath(model.icon)" :alt="model.name" class="ai-icon" />
      <span class="ai-name">{{ model.name }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAIModelsStore } from '@/stores/aiModels'
import { useTabsStore } from '@/stores/tabs'
import type { AIModel } from '@shared/types'

const aiModelsStore = useAIModelsStore()
const tabsStore = useTabsStore()

onMounted(() => {
  aiModelsStore.loadModels()
})

function handleClick(model: AIModel) {
  tabsStore.openTab(model)
}

function getIconPath(icon: string) {
  return `${aiModelsStore.onlineDir}/${icon}`
}
</script>

<style scoped>
.ai-list {
  padding: 8px;
}

.ai-item {
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.ai-item:hover {
  background: var(--hover-color);
}

.ai-icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
}

.ai-name {
  font-size: 14px;
}
</style>
