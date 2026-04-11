import { test, expect } from '@playwright/test'
import { launchElectronApp, getMainWindow } from './helpers/electron'

/**
 * Split Layout Phase 3 E2E Tests
 *
 * Tests advanced features like auto-merge, multi-level splits, etc.
 */
test.describe('第三阶段：完善功能', () => {
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

  test('关闭最后一个标签页后面板应该自动合并', async () => {
    // Open two tabs
    const firstAIItem = mainWindow.locator('.ai-item').nth(0)
    const secondAIItem = mainWindow.locator('.ai-item').nth(1)

    await firstAIItem.click()
    await mainWindow.waitForTimeout(500)
    await secondAIItem.click()
    await mainWindow.waitForTimeout(500)

    // Create split panel
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
    let panelCount = await mainWindow.locator('.tab-group').count()
    expect(panelCount).toBeGreaterThanOrEqual(2)

    // Close the last tab in the second panel
    const closed = await mainWindow.evaluate(() => {
      // @ts-ignore
      const { usePanelStore, useTabsStore } = window.$stores || {}
      if (!usePanelStore || !useTabsStore) return false

      const tabsStore = useTabsStore()
      const panelStore = usePanelStore()

      const panels = panelStore.flatPanels
      if (panels.length >= 2) {
        // Get tabs from the second panel
        const secondPanel = panels[1]
        if (secondPanel.tabs.length > 0) {
          const lastTab = secondPanel.tabs[secondPanel.tabs.length - 1]

          // Close the tab
          tabsStore.closeTab(lastTab.id)

          // Check if panel was closed
          return panelStore.flatPanels.length < 2
        }
      }

      return false
    })

    // Panel should have been merged
    expect(closed).toBe(true)

    // Verify final panel count
    panelCount = await mainWindow.locator('.tab-group').count()
    // Should be back to 1 or 2 (depending on whether the panel auto-closed)
    expect(panelCount).toBeLessThanOrEqual(2)
  })

  test('多级分屏应该正常工作', async () => {
    // Open three tabs
    for (let i = 0; i < 3; i++) {
      const aiItem = mainWindow.locator('.ai-item').nth(i)
      await aiItem.click()
      await mainWindow.waitForTimeout(500)
    }

    // Create first split (horizontal)
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

    let panelCount = await mainWindow.locator('.tab-group').count()
    expect(panelCount).toBeGreaterThanOrEqual(2)

    // Create second split (vertical on the right panel)
    const hasThirdPanel = await mainWindow.evaluate(() => {
      // @ts-ignore
      const { usePanelStore, useTabsStore } = window.$stores || {}
      if (!usePanelStore || !useTabsStore) return false

      const tabsStore = useTabsStore()
      const panelStore = usePanelStore()

      const panels = panelStore.flatPanels
      if (panels.length >= 2) {
        const secondPanel = panels[1]
        const tabs = secondPanel.tabs

        if (tabs.length >= 1) {
          panelStore.handleDrop(tabs[0].id, 'bottom', secondPanel.id)
        }
      }

      // Should have 3 panels now
      return panelStore.flatPanels.length >= 3
    })

    expect(hasThirdPanel).toBe(true)

    panelCount = await mainWindow.locator('.tab-group').count()
    expect(panelCount).toBeGreaterThanOrEqual(3)
  })

  test('面板数量不应该超过最大限制', async () => {
    // Try to create many splits
    const panelCount = await mainWindow.evaluate(() => {
      // @ts-ignore
      const { usePanelStore, useTabsStore } = window.$stores || {}
      if (!usePanelStore || !useTabsStore) return 0

      const tabsStore = useTabsStore()
      const panelStore = usePanelStore()

      // Open a tab first
      const firstAI = document.querySelector('.ai-item')
      if (firstAI) {
        firstAI.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      }

      // Try to create many splits
      for (let i = 0; i < 10; i++) {
        const panels = panelStore.flatPanels
        if (panels.length > 0 && panelStore.canCreateNewPanel()) {
          const targetPanel = panels[0]
          panelStore.handleDrop(tabsStore.tabs[0]?.id || '', 'right', targetPanel.id)
        }
      }

      return panelStore.flatPanels.length
    })

    // Should not exceed 6 panels
    expect(panelCount).toBeLessThanOrEqual(6)
  })

  test('布局有最小尺寸限制', async () => {
    // Check if splitpanes has min-size configured
    const hasMinSize = await mainWindow.evaluate(() => {
      const panes = document.querySelectorAll('.splitpanes__pane')
      if (panes.length > 0) {
        const pane = panes[0] as HTMLElement
        return pane.getAttribute('min-size') !== null
      }
      return false
    })

    expect(hasMinSize).toBe(true)
  })
})
