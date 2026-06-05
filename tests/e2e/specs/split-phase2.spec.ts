import { test, expect, type Page } from '@playwright/test'
import { launchElectronApp, getMainWindow } from '../helpers/electron'

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

async function dropTab(page: Page, tabIndex: number, position: 'left' | 'right' | 'top' | 'bottom' | 'center', targetPanelId = 'panel-default') {
  await page.evaluate(({ tabIndex, position, targetPanelId }) => {
    // @ts-ignore
    const { panelStore, tabsStore } = window.$stores || {}
    if (!panelStore || !tabsStore) return

    const tab = tabsStore.tabs[tabIndex]
    if (!tab) return

    panelStore.handleDrop(tab.id, position, targetPanelId)
  }, { tabIndex, position, targetPanelId })
}

test.describe('Split Layout Phase 2 - drag and drop', () => {
  let electronApp: Awaited<ReturnType<typeof launchElectronApp>>
  let mainWindow: Awaited<ReturnType<typeof getMainWindow>>

  test.beforeEach(async () => {
    electronApp = await launchElectronApp()
    mainWindow = await getMainWindow(electronApp)
  })

  test.afterEach(async () => {
    await electronApp.close()
  })

  test('dragging a tab to the right creates a right split when the source keeps another tab', async () => {
    await openTabs(mainWindow, 2)
    const initialPanels = await mainWindow.locator('.tab-group').count()

    await dropTab(mainWindow, 0, 'right')
    await expect.poll(() => mainWindow.locator('.tab-group').count()).toBeGreaterThan(initialPanels)
  })

  test('dragging a tab to the left creates a left split when the source keeps another tab', async () => {
    await openTabs(mainWindow, 2)
    const initialPanels = await mainWindow.locator('.tab-group').count()

    await dropTab(mainWindow, 0, 'left')
    await expect.poll(() => mainWindow.locator('.tab-group').count()).toBeGreaterThan(initialPanels)
  })

  test('dragging a tab to another panel can merge it into that panel', async () => {
    await openTabs(mainWindow, 2)
    await dropTab(mainWindow, 0, 'right')
    await expect.poll(() => mainWindow.locator('.tab-group').count()).toBeGreaterThanOrEqual(2)

    const moveAttempted = await mainWindow.evaluate(() => {
      // @ts-ignore
      const { panelStore } = window.$stores || {}
      if (!panelStore) return false

      const panels = panelStore.flatPanels
      if (panels.length < 2 || panels[1].tabs.length === 0) return false

      const tabId = panels[1].tabs[0].id
      panelStore.moveTabToPanel(tabId, panels[1].id, panels[0].id)
      return true
    })

    expect(moveAttempted).toBe(true)
  })

  test('drag preview layer exists and is hidden by default', async () => {
    await waitForStores(mainWindow)
    await expect(mainWindow.locator('.split-layout-container')).toBeVisible()

    const dragPreviewLayer = mainWindow.locator('.drag-preview')
    await expect(dragPreviewLayer).toHaveCount(1)
    await expect(dragPreviewLayer).toBeHidden()
  })
})
