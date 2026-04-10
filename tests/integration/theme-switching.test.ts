import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'

describe('Theme Switching Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should sync system theme on mount', async () => {
    vi.mocked(window.electronAPI.getSystemTheme).mockResolvedValue('light')
    const store = useThemeStore()

    await store.syncSystemTheme()

    expect(store.systemTheme).toBe('light')
    expect(store.currentTheme).toBe('light')
  })

  it('should use system theme when set to auto', async () => {
    vi.mocked(window.electronAPI.getSystemTheme).mockResolvedValue('dark')
    const store = useThemeStore()

    store.setTheme('auto')
    await store.syncSystemTheme()

    expect(store.currentTheme).toBe('dark')
  })

  it('should override system theme when explicitly set to dark', async () => {
    vi.mocked(window.electronAPI.getSystemTheme).mockResolvedValue('light')
    const store = useThemeStore()

    store.setTheme('dark')
    await store.syncSystemTheme()

    // 主题是 DARK，不是系统主题 light
    expect(store.theme).toBe('dark')
    expect(store.currentTheme).toBe('dark')
  })

  it('should override system theme when explicitly set to light', async () => {
    vi.mocked(window.electronAPI.getSystemTheme).mockResolvedValue('dark')
    const store = useThemeStore()

    store.setTheme('light')
    await store.syncSystemTheme()

    // 主题是 LIGHT，不是系统主题 dark
    expect(store.theme).toBe('light')
    expect(store.currentTheme).toBe('light')
  })

  it('should toggle settings dialog visibility', () => {
    const store = useThemeStore()

    expect(store.settingsVisible).toBe(false)

    store.setSettingsVisible(true)
    expect(store.settingsVisible).toBe(true)

    store.setSettingsVisible(false)
    expect(store.settingsVisible).toBe(false)
  })

  it('should cycle through all theme options', () => {
    const store = useThemeStore()

    // 默认是 auto
    expect(store.theme).toBe('auto')

    // 切换到 dark
    store.setTheme('dark')
    expect(store.theme).toBe('dark')

    // 切换到 light
    store.setTheme('light')
    expect(store.theme).toBe('light')

    // 切换回 auto
    store.setTheme('auto')
    expect(store.theme).toBe('auto')
  })
})
