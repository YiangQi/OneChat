<template>
  <div class="app-container" :class="themeClass">
    <ActivityBar />
    <Sidebar />
    <TabContainer />
    <SettingsButton />
    <SettingsDialog v-model="settingsVisible" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import ActivityBar from '@/components/ActivityBar.vue'
import Sidebar from '@/components/Sidebar.vue'
import TabContainer from '@/components/TabContainer.vue'
import SettingsButton from '@/components/SettingsButton.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'

const themeStore = useThemeStore()
const settingsVisible = computed({
  get: () => themeStore.settingsVisible,
  set: (val) => themeStore.setSettingsVisible(val)
})

const themeClass = computed(() => ({
  'theme-dark': themeStore.currentTheme === 'dark',
  'theme-light': themeStore.currentTheme === 'light'
}))

onMounted(() => {
  themeStore.syncSystemTheme()
})
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
</style>
