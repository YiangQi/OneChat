<template>
  <div class="tab-item" :class="{ active }">
    <img :src="icon" :alt="model.name" class="tab-icon" />
    <span class="tab-name">{{ model.name }}</span>
    <el-icon class="tab-close" @click="$emit('close')"><Close /></el-icon>
  </div>
</template>

<script setup lang="ts">
import { Close } from '@element-plus/icons-vue'
import type { AIModel } from '@shared/types'

defineProps<{
  model: AIModel
  icon: string
  active: boolean
}>()

defineEmits<{
  close: []
}>()
</script>

<style scoped>
.tab-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border-right: 1px solid var(--border-color);
  cursor: pointer;
}

.tab-item.active {
  background: var(--bg-primary);
}

.tab-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

.tab-name {
  flex: 1;
  font-size: 13px;
}

.tab-close {
  opacity: 0;
  transition: opacity 0.2s;
}

.tab-item:hover .tab-close {
  opacity: 0.6;
}
</style>
