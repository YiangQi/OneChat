<template>
  <el-button
    class="settings-button"
    :icon="Setting"
    circle
    @click="themeStore.setSettingsVisible(true)"
  />
</template>

<script setup lang="ts">
import { Setting } from '@element-plus/icons-vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
</script>

<style scoped>
.settings-button {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1000;
}
</style>
