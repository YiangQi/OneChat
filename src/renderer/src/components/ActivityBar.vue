<template>
  <div class="activity-bar">
    <div
      v-for="item in items"
      :key="item.id"
      :class="['activity-item', { active: activeId === item.id }]"
      @click="$emit('select', item.id)"
    >
      <el-icon :size="24">
        <component :is="item.icon" />
      </el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Chat, Setting } from '@element-plus/icons-vue'

interface MenuItem {
  id: string
  icon: any
}

defineProps<{
  items: MenuItem[]
  activeId: string
}>()

defineEmits<{
  select: [id: string]
}>()
</script>

<style scoped>
.activity-bar {
  width: 48px;
  height: 100%;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 8px;
}

.activity-item {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.activity-item:hover {
  opacity: 1;
}

.activity-item.active {
  opacity: 1;
  border-left: 2px solid var(--accent-color);
}
</style>
