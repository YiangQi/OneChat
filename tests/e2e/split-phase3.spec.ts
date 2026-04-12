import { test, expect, type Page } from '@playwright/test'
import { launchElectronApp, getMainWindow } from './helpers/electron'

async function waitForStores(page: Page) {
  await page.waitForFunction(() => {
    // @ts-ignore
    return Boolean(window.$stores?.panelStore && window.$stores?.tabsStore)
  }, { timeout: 5000 })
}

async function openTabs(page: Page, count: number) {
  await waitForStores(page)
  await page.waitForTimeout(1000)

  for (let i = 0; i < count; i++) {
    await page.locator('.ai-item').nth(i).click()
    await page.waitForTimeout(300)
  }
}

test.describe('Split Layout Phase 3 - advanced behavior', () => {
  let electronApp: Awaited<ReturnType<typeof launchElectronApp>>
  let mainWindow: Awaited<ReturnType<typeof getMainWindow>>

  test.beforeEach(async () => {
    electronApp = await launchElectronApp()
    mainWindow = await getMainWindow(electronApp)
  })

  test.afterEach(async () => {
    await electronApp.close()
  })

  test('empty panels are removed and parent panels merge automatically', async () => {
    await openTabs(mainWindow, 2)

    await mainWindow.evaluate(() => {
      // @ts-ignore
      const { panelStore, tabsStore } = window.$stores || {}
      panelStore.handleDrop(tabsStore.tabs[0].id, 'right', 'panel-default')
    })

    await expect.poll(() => mainWindow.locator('.tab-group').count()).toBeGreaterThanOrEqual(2)

    await mainWindow.evaluate(() => {
      // @ts-ignore
      const { panelStore } = window.$stores || {}
      const splitPanel = panelStore.flatPanels.find((panel: any) => panel.id !== 'panel-default')
      if (splitPanel?.tabs.length) {
        panelStore.closeTab(splitPanel.id, splitPanel.tabs[0].id)
      }
    })

    await expect.poll(() => mainWindow.locator('.tab-group').count()).toBe(1)
  })

  test('nested splits can create three rendered panels', async () => {
    await openTabs(mainWindow, 3)

    const hasThirdPanel = await mainWindow.evaluate(() => {
      // @ts-ignore
      const { panelStore, tabsStore } = window.$stores || {}
      if (!panelStore || !tabsStore || tabsStore.tabs.length < 3) return false

      panelStore.handleDrop(tabsStore.tabs[0].id, 'right', 'panel-default')

      const defaultPanel = panelStore.findPanel('panel-default')
      if (!defaultPanel || defaultPanel.tabs.length < 2) return false

      panelStore.handleDrop(defaultPanel.tabs[0].id, 'bottom', defaultPanel.id)
      return panelStore.flatPanels.length >= 3
    })

    expect(hasThirdPanel).toBe(true)
    await expect.poll(() => mainWindow.locator('.tab-group').count()).toBeGreaterThanOrEqual(3)
  })

  test('right split can expand from two columns to three columns without blank panes', async () => {
    await openTabs(mainWindow, 3)

    const layout = await mainWindow.evaluate(() => {
      // @ts-ignore
      const { panelStore, tabsStore } = window.$stores || {}
      if (!panelStore || !tabsStore || tabsStore.tabs.length < 3) return null

      panelStore.handleDrop(tabsStore.tabs[0].id, 'right', 'panel-default')

      const rightPanel = panelStore.flatPanels.find((panel: any) => panel.id !== 'panel-default')
      if (!rightPanel) return null

      panelStore.moveTabToPanel(tabsStore.tabs[2].id, 'panel-default', rightPanel.id)
      panelStore.handleDrop(tabsStore.tabs[2].id, 'right', rightPanel.id)

      return {
        leafCount: panelStore.flatPanels.length,
        tabCounts: panelStore.flatPanels.map((panel: any) => panel.tabs.length),
        rootSizes: panelStore.panels[0].sizes,
        rootChildCount: panelStore.panels[0].children?.length ?? 0
      }
    })

    expect(layout).toEqual(expect.objectContaining({
      leafCount: 3,
      tabCounts: [1, 1, 1],
      rootChildCount: 3
    }))
    expect(layout?.rootSizes).toHaveLength(3)
    expect(layout?.rootSizes.reduce((sum: number, size: number) => sum + size, 0)).toBeCloseTo(100, 4)

    await expect.poll(() => mainWindow.locator('.tab-group').count()).toBe(3)

    const bounds = await mainWindow.evaluate(() => {
      const root = document.querySelector('.splitpanes-root')?.getBoundingClientRect()
      const tabGroups = [...document.querySelectorAll('.tab-group')]
        .map(element => element.getBoundingClientRect())
        .sort((a, b) => a.left - b.left)
      const lastPanel = tabGroups[tabGroups.length - 1]

      if (!root || !lastPanel) return null

      return {
        rootRight: root.right,
        lastPanelRight: lastPanel.right,
        unusedRightSpace: root.right - lastPanel.right
      }
    })

    expect(bounds?.unusedRightSpace).toBeLessThan(2)

    await mainWindow.evaluate(() => {
      // @ts-ignore
      const { panelStore } = window.$stores || {}
      if (panelStore?.panels[0]?.children?.length === 3) {
        panelStore.panels[0].sizes = [20, 20, 20]
      }
    })

    const recoveredBounds = await mainWindow.evaluate(() => {
      const root = document.querySelector('.splitpanes-root')?.getBoundingClientRect()
      const tabGroups = [...document.querySelectorAll('.tab-group')]
        .map(element => element.getBoundingClientRect())
        .sort((a, b) => a.left - b.left)
      const lastPanel = tabGroups[tabGroups.length - 1]

      if (!root || !lastPanel) return null

      return {
        unusedRightSpace: root.right - lastPanel.right
      }
    })

    expect(recoveredBounds?.unusedRightSpace).toBeLessThan(2)

    await expect.poll(async () => {
      return mainWindow.evaluate(() => {
        const visibleWebviews = [...document.querySelectorAll('.webview-container')]
          .filter(element => {
            const rect = element.getBoundingClientRect()
            return rect.width > 0 && rect.height > 0
          })
        if (visibleWebviews.length === 0) return false

        return visibleWebviews.every(visibleWebview => {
          const tabId = visibleWebview.querySelector('.webview')?.getAttribute('data-tab-id')
          const tab = [...document.querySelectorAll('.tab')]
            .find(element => element.getAttribute('data-testid') === `tab-${tabId}`)
          const content = tab?.closest('.tab-group')?.querySelector('.tab-content')

          if (!content) return false

          const webviewRect = visibleWebview.getBoundingClientRect()
          const contentRect = content.getBoundingClientRect()

          return Math.abs(webviewRect.width - contentRect.width) < 2 &&
            Math.abs(webviewRect.height - contentRect.height) < 2 &&
            Math.abs(webviewRect.left - contentRect.left) < 2 &&
            Math.abs(webviewRect.top - contentRect.top) < 2
        })
      })
    }).toBe(true)
  })

  test('panel count does not exceed the maximum limit', async () => {
    await openTabs(mainWindow, 6)

    const panelCount = await mainWindow.evaluate(() => {
      // @ts-ignore
      const { panelStore, tabsStore } = window.$stores || {}
      if (!panelStore || !tabsStore) return 0

      for (let i = 0; i < 10; i++) {
        const sourcePanel = panelStore.flatPanels.find((panel: any) => panel.tabs.length > 1)
        if (!sourcePanel || !panelStore.canCreateNewPanel()) break

        panelStore.handleDrop(sourcePanel.tabs[0].id, 'right', sourcePanel.id)
      }

      return panelStore.flatPanels.length
    })

    expect(panelCount).toBeLessThanOrEqual(6)
  })

  test('split panes expose minimum-size constrained panes', async () => {
    await openTabs(mainWindow, 2)

    await mainWindow.evaluate(() => {
      // @ts-ignore
      const { panelStore, tabsStore } = window.$stores || {}
      panelStore.handleDrop(tabsStore.tabs[0].id, 'right', 'panel-default')
    })

    await expect.poll(() => mainWindow.locator('.splitpanes__pane').count()).toBeGreaterThanOrEqual(2)
  })
})
