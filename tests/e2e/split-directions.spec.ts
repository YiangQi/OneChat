import { test, expect } from '@playwright/test'
import { launchElectronApp, getMainWindow } from './helpers/electron'

/**
 * Split Layout Direction Tests
 *
 * Tests that split panels are created in the correct direction
 */
test.describe('分栏方向测试', () => {
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
    // Wait for models to load and app to fully initialize
    await mainWindow.waitForTimeout(3000)

    // Wait for stores to be available
    await mainWindow.waitForFunction(() => {
      // @ts-ignore
      return window.$stores && window.$stores.panelStore && window.$stores.tabsStore
    }, { timeout: 5000 })
  })

  test('向右拖拽应该创建左右分栏（垂直分割线）', async () => {
    // Open a tab first
    const firstAIItem = mainWindow.locator('.ai-item').first()
    await firstAIItem.click()
    await mainWindow.waitForTimeout(500)

    // Split to the right
    await mainWindow.evaluate(() => {
      // @ts-ignore
      const { panelStore, tabsStore } = window.$stores || {}
      if (!panelStore || !tabsStore) return

      const tabs = tabsStore.tabs
      if (tabs.length === 0) return

      const tabId = tabs[0].id
      panelStore.handleDrop(tabId, 'right', 'panel-default')
    })

    await mainWindow.waitForTimeout(200)

    // Verify the panel structure
    const panelInfo = await mainWindow.evaluate(() => {
      // @ts-ignore
      const { panelStore } = window.$stores || {}
      if (!panelStore) return null

      // Get the parent panel (should have direction)
      const parent = panelStore.panels.find(p => p.direction)
      if (!parent) return null

      return {
        direction: parent.direction,
        childCount: parent.children?.length || 0
      }
    })

    // Should be vertical (垂直分割线 = 左右分栏)
    expect(panelInfo?.direction).toBe('vertical')
    expect(panelInfo?.childCount).toBe(2)
  })

  test('向左拖拽应该创建左右分栏（垂直分割线）', async () => {
    // Open a tab first
    const firstAIItem = mainWindow.locator('.ai-item').first()
    await firstAIItem.click()
    await mainWindow.waitForTimeout(500)

    // Split to the left
    await mainWindow.evaluate(() => {
      // @ts-ignore
      const { panelStore, tabsStore } = window.$stores || {}
      if (!panelStore || !tabsStore) return

      const tabs = tabsStore.tabs
      if (tabs.length === 0) return

      const tabId = tabs[0].id
      panelStore.handleDrop(tabId, 'left', 'panel-default')
    })

    await mainWindow.waitForTimeout(200)

    // Verify the panel structure
    const panelInfo = await mainWindow.evaluate(() => {
      // @ts-ignore
      const { panelStore } = window.$stores || {}
      if (!panelStore) return null

      const parent = panelStore.panels.find(p => p.direction)
      if (!parent) return null

      return {
        direction: parent.direction,
        childCount: parent.children?.length || 0
      }
    })

    // Should be vertical (垂直分割线 = 左右分栏)
    expect(panelInfo?.direction).toBe('vertical')
    expect(panelInfo?.childCount).toBe(2)
  })

  test('向下拖拽应该创建上下分栏（水平分割线）', async () => {
    // Open a tab first
    const firstAIItem = mainWindow.locator('.ai-item').first()
    await firstAIItem.click()
    await mainWindow.waitForTimeout(500)

    // Split to the bottom
    await mainWindow.evaluate(() => {
      // @ts-ignore
      const { panelStore, tabsStore } = window.$stores || {}
      if (!panelStore || !tabsStore) return

      const tabs = tabsStore.tabs
      if (tabs.length === 0) return

      const tabId = tabs[0].id
      panelStore.handleDrop(tabId, 'bottom', 'panel-default')
    })

    await mainWindow.waitForTimeout(200)

    // Verify the panel structure
    const panelInfo = await mainWindow.evaluate(() => {
      // @ts-ignore
      const { panelStore } = window.$stores || {}
      if (!panelStore) return null

      const parent = panelStore.panels.find(p => p.direction)
      if (!parent) return null

      return {
        direction: parent.direction,
        childCount: parent.children?.length || 0
      }
    })

    // Should be horizontal (水平分割线 = 上下分栏)
    expect(panelInfo?.direction).toBe('horizontal')
    expect(panelInfo?.childCount).toBe(2)
  })

  test('向上拖拽应该创建上下分栏（水平分割线）', async () => {
    // Open a tab first
    const firstAIItem = mainWindow.locator('.ai-item').first()
    await firstAIItem.click()
    await mainWindow.waitForTimeout(500)

    // Split to the top
    await mainWindow.evaluate(() => {
      // @ts-ignore
      const { panelStore, tabsStore } = window.$stores || {}
      if (!panelStore || !tabsStore) return

      const tabs = tabsStore.tabs
      if (tabs.length === 0) return

      const tabId = tabs[0].id
      panelStore.handleDrop(tabId, 'top', 'panel-default')
    })

    await mainWindow.waitForTimeout(200)

    // Verify the panel structure
    const panelInfo = await mainWindow.evaluate(() => {
      // @ts-ignore
      const { panelStore } = window.$stores || {}
      if (!panelStore) return null

      const parent = panelStore.panels.find(p => p.direction)
      if (!parent) return null

      return {
        direction: parent.direction,
        childCount: parent.children?.length || 0
      }
    })

    // Should be horizontal (水平分割线 = 上下分栏)
    expect(panelInfo?.direction).toBe('horizontal')
    expect(panelInfo?.childCount).toBe(2)
  })

  test('分栏后应该有正确的 sizes 数组', async () => {
    // Open a tab first
    const firstAIItem = mainWindow.locator('.ai-item').first()
    await firstAIItem.click()
    await mainWindow.waitForTimeout(500)

    // Split to the right
    await mainWindow.evaluate(() => {
      // @ts-ignore
      const { panelStore, tabsStore } = window.$stores || {}
      if (!panelStore || !tabsStore) return

      const tabs = tabsStore.tabs
      if (tabs.length === 0) return

      const tabId = tabs[0].id
      panelStore.handleDrop(tabId, 'right', 'panel-default')
    })

    await mainWindow.waitForTimeout(200)

    // Verify sizes array
    const panelInfo = await mainWindow.evaluate(() => {
      // @ts-ignore
      const { panelStore } = window.$stores || {}
      if (!panelStore) return null

      const parent = panelStore.panels.find(p => p.direction)
      if (!parent || !parent.sizes) return null

      return {
        sizes: parent.sizes,
        length: parent.sizes.length
      }
    })

    // Should have sizes array with 2 elements
    expect(panelInfo?.length).toBe(2)
    expect(panelInfo?.sizes[0]).toBe(50)
    expect(panelInfo?.sizes[1]).toBe(50)
  })
})
