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

async function dropTab(page: Page, tabIndex: number, position: 'left' | 'right' | 'top' | 'bottom') {
  await page.evaluate(({ tabIndex, position }) => {
    // @ts-ignore
    const { panelStore, tabsStore } = window.$stores || {}
    if (!panelStore || !tabsStore) return

    const tab = tabsStore.tabs[tabIndex]
    if (!tab) return

    panelStore.handleDrop(tab.id, position, 'panel-default')
  }, { tabIndex, position })
}

test.describe('Split Layout Phase 1 - basic split behavior', () => {
  let electronApp: Awaited<ReturnType<typeof launchElectronApp>>
  let mainWindow: Awaited<ReturnType<typeof getMainWindow>>

  test.beforeEach(async () => {
    electronApp = await launchElectronApp()
    mainWindow = await getMainWindow(electronApp)
  })

  test.afterEach(async () => {
    await electronApp.close()
  })

  test('shows one default panel', async () => {
    await waitForStores(mainWindow)
    await expect.poll(() => mainWindow.locator('.tab-group').count()).toBe(1)
  })

  test('opens an AI model tab in the default panel', async () => {
    const initialTabs = await mainWindow.locator('.tab').count()
    await openTabs(mainWindow, 1)

    await expect.poll(() => mainWindow.locator('.tab').count()).toBeGreaterThan(initialTabs)
    await expect(mainWindow.locator('.tab-bar')).toBeVisible()
  })

  test('creates a resizable split when the source panel keeps another tab', async () => {
    await openTabs(mainWindow, 2)
    const initialPanels = await mainWindow.locator('.tab-group').count()

    await dropTab(mainWindow, 0, 'right')
    await expect.poll(() => mainWindow.locator('.tab-group').count()).toBeGreaterThan(initialPanels)
    await expect(mainWindow.locator('.splitpanes__splitter').first()).toBeVisible()
  })

  test('renders the split layout container', async () => {
    await waitForStores(mainWindow)
    await expect(mainWindow.locator('.split-layout-container')).toBeVisible()
    await expect(mainWindow.locator('.splitpanes-root')).toBeVisible()
  })
})
