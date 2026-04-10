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
// No icon imports needed - icons come from props

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
  background: #1a1a1a;
  border-right: 1px solid #444;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 8px;
  flex-shrink: 0;
  user-select: none;
  box-shadow: 1px 0 2px rgba(0, 0, 0, 0.1);
}

/* 浅色主题 */
.theme-light .activity-bar {
  background: #e8e8e8;
  border-right: 1px solid #bbb;
  box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05);
}

.activity-item {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.activity-item:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.08);
}

.theme-light .activity-item:hover {
  background: rgba(0, 0, 0, 0.06);
}

.activity-item.active {
  opacity: 1;
  border-left-color: var(--accent-color);
  background: rgba(255, 255, 255, 0.1);
}

.theme-light .activity-item.active {
  background: rgba(0, 0, 0, 0.08);
}
</style>
