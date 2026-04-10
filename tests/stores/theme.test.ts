import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { THEME } from '@shared/constants'

describe('Theme Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should have default theme as auto', () => {
    const store = useThemeStore()
    expect(store.theme).toBe('auto')
  })

  it('should return dark theme when system is dark and theme is auto', async () => {
    vi.mocked(window.electronAPI.getSystemTheme).mockResolvedValue('dark')
    const store = useThemeStore()
    await store.syncSystemTheme()
    expect(store.currentTheme).toBe('dark')
  })

  it('should set theme to light when explicitly set', () => {
    const store = useThemeStore()
    store.setTheme('light')
    expect(store.theme).toBe('light')
  })

  it('should set theme to dark when explicitly set', () => {
    const store = useThemeStore()
    store.setTheme('dark')
    expect(store.theme).toBe('dark')
  })

  it('should toggle settings visibility', () => {
    const store = useThemeStore()
    expect(store.settingsVisible).toBe(false)
    store.setSettingsVisible(true)
    expect(store.settingsVisible).toBe(true)
    store.setSettingsVisible(false)
    expect(store.settingsVisible).toBe(false)
  })

  it('should use light theme when system is light and theme is auto', async () => {
    vi.mocked(window.electronAPI.getSystemTheme).mockResolvedValue('light')
    const store = useThemeStore()
    await store.syncSystemTheme()
    expect(store.currentTheme).toBe('light')
  })

  it('should override system theme when explicitly set to dark', async () => {
    vi.mocked(window.electronAPI.getSystemTheme).mockResolvedValue('light')
    const store = useThemeStore()
    store.setTheme('dark')
    await store.syncSystemTheme()
    // 主题是 dark，不是系统主题 light
    expect(store.currentTheme).toBe('dark')
  })

  it('should override system theme when explicitly set to light', async () => {
    vi.mocked(window.electronAPI.getSystemTheme).mockResolvedValue('dark')
    const store = useThemeStore()
    store.setTheme('light')
    await store.syncSystemTheme()
    // 主题是 light，不是系统主题 dark
    expect(store.currentTheme).toBe('light')
  })
})
