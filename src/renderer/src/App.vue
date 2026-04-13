<template>
  <div class="app-container" :class="themeClass">
    <ActivityBar :items="menuItems" :active-id="activeModule" @select="activeModule = $event" />
    <Sidebar :active-module="activeModule" />
    <div class="main-content-wrapper">
      <SplitLayoutContainer />
      <BottomComposer />
    </div>
    <SettingsDialog v-model="settingsVisible" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ChatDotRound, Setting } from '@element-plus/icons-vue'
import { useThemeStore } from '@/stores/theme'
import ActivityBar from '@/components/ActivityBar.vue'
import Sidebar from '@/components/Sidebar.vue'
import SplitLayoutContainer from '@/components/SplitLayoutContainer.vue'
import BottomComposer from '@/components/BottomComposer.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'

const themeStore = useThemeStore()
const activeModule = ref('ai')

const menuItems = [
  { id: 'ai', icon: ChatDotRound },
  { id: 'settings', icon: Setting }
]

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

.main-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}
</style>
