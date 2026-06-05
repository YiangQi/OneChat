import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import SettingsDialog from '@/components/SettingsDialog.vue'

describe('SettingsDialog Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should reflect theme store value', () => {
    const themeStore = useThemeStore()
    themeStore.setSettingsVisible(true)

    const wrapper = mount(SettingsDialog)
    // Element Plus Dialog 应该渲染
    expect(wrapper.find('.el-dialog').exists()).toBe(true)
  })

  it('should update theme when changed', async () => {
    const wrapper = mount(SettingsDialog)
    const themeStore = useThemeStore()

    // 初始主题是 auto
    expect(themeStore.theme).toBe('auto')

    // 模拟主题切换
    themeStore.setTheme('dark')
    expect(themeStore.theme).toBe('dark')
  })

  it('should toggle visibility via store', () => {
    const themeStore = useThemeStore()

    expect(themeStore.settingsVisible).toBe(false)

    themeStore.setSettingsVisible(true)
    expect(themeStore.settingsVisible).toBe(true)

    themeStore.setSettingsVisible(false)
    expect(themeStore.settingsVisible).toBe(false)
  })

  it('should render all theme options', () => {
    const themeStore = useThemeStore()
    themeStore.setSettingsVisible(true)

    const wrapper = mount(SettingsDialog)
    // 组件包含主题设置表单项
    expect(wrapper.html()).toContain('主题')
    // stub 组件会渲染 el-radio 类
    expect(wrapper.html()).toContain('el-radio')
  })

  it('should bind visibility to store correctly', () => {
    const themeStore = useThemeStore()
    themeStore.setSettingsVisible(true)

    const wrapper = mount(SettingsDialog)

    // 通过 wrapper 访问组件实例的 visible computed
    const component = wrapper.vm as any
    expect(component.visible).toBe(true)

    themeStore.setSettingsVisible(false)
    expect(component.visible).toBe(false)
  })
})
