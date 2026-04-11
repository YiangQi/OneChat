import { test, expect } from '@playwright/test'
import { launchElectronApp, getMainWindow } from './helpers/electron'

/**
 * Split Layout Phase 2 E2E Tests
 *
 * Tests drag and drop functionality for split panels
 */
test.describe('第二阶段：拖拽功能', () => {
  let electronApp: Awaited<ReturnType<typeof launchElectronApp>>
  let mainWindow: Awaited<ReturnType<typeof getMainWindow>>

  test.beforeAll(async () => {
    electronApp = await launchElectronApp()
    mainWindow = await getMainWindow(electronApp)
  })

  test.afterAll(async () => {
    await electronApp.close()
  })

  test.beforeEach(async () => {
    // Wait for models to load
    await mainWindow.waitForTimeout(2000)
  })

  test('通过 store API 测试：拖拽标签页到右边应该创建右侧分屏', async () => {
    // Open a tab first
    const firstAIItem = mainWindow.locator('.ai-item').first()
    await firstAIItem.click()
    await mainWindow.waitForTimeout(500)

    // Get initial panel count
    const initialPanels = await mainWindow.locator('.tab-group').count()

    // Simulate drag to right edge using store API
    const createdSplit = await mainWindow.evaluate(() => {
      // @ts-ignore - Accessing store for testing
      const { usePanelStore, useTabsStore } = window.$stores || {}
      if (!usePanelStore || !useTabsStore) return false

      const tabsStore = useTabsStore()
      const panelStore = usePanelStore()

      // Get the first tab
      const tabs = tabsStore.tabs
      if (tabs.length === 0) return false

      const tabId = tabs[0].id

      // Simulate drop to right
      panelStore.handleDrop(tabId, 'right', 'panel-default')

      // Check if split was created
      return panelStore.flatPanels.length >= 2
    })

    expect(createdSplit).toBe(true)

    // Verify panel count increased
    const finalPanels = await mainWindow.locator('.tab-group').count()
    expect(finalPanels).toBeGreaterThan(initialPanels)
  })

  test('通过 store API 测试：拖拽标签页到左边应该创建左侧分屏', async () => {
    // Open a tab first
    const firstAIItem = mainWindow.locator('.ai-item').first()
    await firstAIItem.click()
    await mainWindow.waitForTimeout(500)

    // Simulate drag to left edge using store API
    const createdSplit = await mainWindow.evaluate(() => {
      // @ts-ignore - Accessing store for testing
      const { usePanelStore, useTabsStore } = window.$stores || {}
      if (!usePanelStore || !useTabsStore) return false

      const tabsStore = useTabsStore()
      const panelStore = usePanelStore()

      // Get the first tab
      const tabs = tabsStore.tabs
      if (tabs.length === 0) return false

      const tabId = tabs[0].id

      // Simulate drop to left
      panelStore.handleDrop(tabId, 'left', 'panel-default')

      // Check if split was created
      return panelStore.flatPanels.length >= 2
    })

    expect(createdSplit).toBe(true)
  })

  test('通过 store API 测试：拖拽标签页到另一个面板应该合并', async () => {
    // Open two tabs
    const firstAIItem = mainWindow.locator('.ai-item').nth(0)
    const secondAIItem = mainWindow.locator('.ai-item').nth(1)

    await firstAIItem.click()
    await mainWindow.waitForTimeout(500)
    await secondAIItem.click()
    await mainWindow.waitForTimeout(500)

    // Create split first
    await mainWindow.evaluate(() => {
      // @ts-ignore
      const { usePanelStore, useTabsStore } = window.$stores || {}
      if (!usePanelStore || !useTabsStore) return

      const tabsStore = useTabsStore()
      const panelStore = usePanelStore()

      const tabs = tabsStore.tabs
      if (tabs.length >= 1) {
        panelStore.handleDrop(tabs[0].id, 'right', 'panel-default')
      }
    })

    // Check we have 2 panels
    const panelsAfterSplit = await mainWindow.locator('.tab-group').count()
    expect(panelsAfterSplit).toBeGreaterThanOrEqual(2)

    // Now merge by moving the second tab to the first panel
    const merged = await mainWindow.evaluate(() => {
      // @ts-ignore
      const { usePanelStore, useTabsStore } = window.$stores || {}
      if (!usePanelStore || !useTabsStore) return false

      const tabsStore = useTabsStore()
      const panelStore = usePanelStore()

      const tabs = tabsStore.tabs
      const panels = panelStore.flatPanels

      if (panels.length >= 2 && tabs.length >= 2) {
        // Move second tab to first panel (center drop = merge)
        const sourcePanelId = panels[1].id
        const targetPanelId = panels[0].id
        panelStore.moveTabToPanel(tabs[1].id, sourcePanelId, targetPanelId)
      }

      // Check if panels merged (should have fewer panels now)
      return panelStore.flatPanels.length < 2
    })

    expect(merged).toBe(true)
  })

  test('拖拽预览层应该存在', async () => {
    // Check if DragPreviewLayer component is mounted
    const dragPreviewLayer = mainWindow.locator('.drag-preview')

    // Initially it should not be visible
    const isVisible = await dragPreviewLayer.isVisible().catch(() => false)
    expect(isVisible).toBe(false)

    // But it should exist in the DOM
    const exists = await mainWindow.evaluate(() => {
      const el = document.querySelector('.drag-preview')
      return el !== null
    })

    expect(exists).toBe(true)
  })
})
