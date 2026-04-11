import { test, expect } from '@playwright/test'
import { launchElectronApp, getMainWindow } from './helpers/electron'

/**
 * Split Layout Phase 1 E2E Tests
 *
 * Tests basic split panel functionality
 */
test.describe('第一阶段：基础分屏功能', () => {
  let electronApp: Awaited<ReturnType<typeof launchElectronApp>>
  let mainWindow: Awaited<ReturnType<typeof getMainWindow>>

  test.beforeAll(async () => {
    electronApp = await launchElectronApp()
    mainWindow = await getMainWindow(electronApp)
  })

  test.afterAll(async () => {
    await electronApp.close()
  })

  test('应该显示一个默认面板', async () => {
    // Wait for app to fully load
    await mainWindow.waitForTimeout(2000)

    // Check for default panel (tab-group)
    const tabGroups = mainWindow.locator('.tab-group')
    const count = await tabGroups.count()

    expect(count).toBe(1)
  })

  test('打开 AI 模型后应该在面板中显示', async () => {
    // Wait for models to load
    await mainWindow.waitForTimeout(2000)

    // Get initial tab count
    const initialTabs = await mainWindow.locator('.tab').count()

    // Click on first AI model
    const firstAIItem = mainWindow.locator('.ai-item').first()
    await firstAIItem.click()
    await mainWindow.waitForTimeout(500)

    // Verify a tab was opened
    const tabs = await mainWindow.locator('.tab').count()
    expect(tabs).toBeGreaterThan(initialTabs)

    // Check if tab bar is visible
    const tabBar = mainWindow.locator('.tab-bar')
    await expect(tabBar).toBeVisible()
  })

  test('面板应该可以调整大小', async () => {
    // Wait for models to load
    await mainWindow.waitForTimeout(2000)

    // Open a tab first
    const firstAIItem = mainWindow.locator('.ai-item').first()
    await firstAIItem.click()
    await mainWindow.waitForTimeout(500)

    // Create a split panel by using the store directly
    // This simulates what would happen with drag-to-split
    const hasSplitPanel = await mainWindow.evaluate(() => {
      // @ts-ignore - Accessing store for testing
      const { usePanelStore } = window.$stores || {}
      if (!usePanelStore) return false

      const panelStore = usePanelStore()
      panelStore.splitPanel('panel-default', 'after', 'horizontal')

      // Check if split was created
      const parent = panelStore.panels.find((p: any) => p.children)
      return !!parent
    })

    expect(hasSplitPanel).toBe(true)

    // Check if splitpanes resizer exists
    const resizer = mainWindow.locator('.splitpanes__resizer')
    const resizerCount = await resizer.count()

    expect(resizerCount).toBeGreaterThan(0)
  })

  test('splitpanes 应该正确渲染', async () => {
    // Wait for app to fully load
    await mainWindow.waitForTimeout(2000)

    // Check if splitpanes container exists
    const splitContainer = mainWindow.locator('.split-layout-container')
    await expect(splitContainer).toBeVisible()

    // Check if splitpanes root exists
    const splitpanesRoot = mainWindow.locator('.splitpanes-root')
    await expect(splitpanesRoot).toBeVisible()
  })
})
