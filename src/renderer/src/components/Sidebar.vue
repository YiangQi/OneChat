<template>
  <div class="sidebar">
    <AIList v-if="activeModule === 'ai'" />
  </div>
</template>

<script setup lang="ts">
import AIList from './AIList.vue'

defineProps<{
  activeModule: string
}>()
</script>

<style scoped>
.sidebar {
  width: 250px;
  height: 100%;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
}
</style>
