// src/renderer/src/stores/theme.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { THEME } from '@shared/constants'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<'auto' | 'dark' | 'light'>('auto')
  const systemTheme = ref<'dark' | 'light'>('light')
  const settingsVisible = ref(false)

  const currentTheme = computed(() => {
    if (theme.value === 'auto') {
      return systemTheme.value
    }
    return theme.value
  })

  function setTheme(newTheme: 'auto' | 'dark' | 'light') {
    theme.value = newTheme
  }

  async function syncSystemTheme() {
    const theme = await window.electronAPI.getSystemTheme()
    systemTheme.value = theme as 'dark' | 'light'

    // Listen for system theme changes
    window.electronAPI.onThemeSystemChanged((newTheme) => {
      systemTheme.value = newTheme as 'dark' | 'light'
    })
  }

  function setSettingsVisible(visible: boolean) {
    settingsVisible.value = visible
  }

  return {
    theme,
    systemTheme,
    settingsVisible,
    currentTheme,
    setTheme,
    syncSystemTheme,
    setSettingsVisible
  }
})
