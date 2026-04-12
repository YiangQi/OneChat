import { test, expect, type Page } from '@playwright/test'
import { launchElectronApp, getMainWindow } from './helpers/electron'

type DropPosition = 'left' | 'right' | 'top' | 'bottom'

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

async function splitAndReadRoot(page: Page, position: DropPosition) {
  await openTabs(page, 2)

  return page.evaluate((position) => {
    // @ts-ignore
    const { panelStore, tabsStore } = window.$stores || {}
    if (!panelStore || !tabsStore || tabsStore.tabs.length < 2) return null

    panelStore.handleDrop(tabsStore.tabs[0].id, position, 'panel-default')
    const parent = panelStore.panels.find((panel: any) => panel.direction)
    if (!parent) return null

    return {
      direction: parent.direction,
      childCount: parent.children?.length || 0,
      sizes: parent.sizes || []
    }
  }, position)
}

test.describe('Split direction behavior', () => {
  let electronApp: Awaited<ReturnType<typeof launchElectronApp>>
  let mainWindow: Awaited<ReturnType<typeof getMainWindow>>

  test.beforeEach(async () => {
    electronApp = await launchElectronApp()
    mainWindow = await getMainWindow(electronApp)
  })

  test.afterEach(async () => {
    await electronApp.close()
  })

  test('right split creates a vertical root split', async () => {
    const panelInfo = await splitAndReadRoot(mainWindow, 'right')
    expect(panelInfo?.direction).toBe('vertical')
    expect(panelInfo?.childCount).toBe(2)
  })

  test('left split creates a vertical root split', async () => {
    const panelInfo = await splitAndReadRoot(mainWindow, 'left')
    expect(panelInfo?.direction).toBe('vertical')
    expect(panelInfo?.childCount).toBe(2)
  })

  test('bottom split creates a horizontal root split', async () => {
    const panelInfo = await splitAndReadRoot(mainWindow, 'bottom')
    expect(panelInfo?.direction).toBe('horizontal')
    expect(panelInfo?.childCount).toBe(2)
  })

  test('top split creates a horizontal root split', async () => {
    const panelInfo = await splitAndReadRoot(mainWindow, 'top')
    expect(panelInfo?.direction).toBe('horizontal')
    expect(panelInfo?.childCount).toBe(2)
  })

  test('split creates matching pane sizes', async () => {
    const panelInfo = await splitAndReadRoot(mainWindow, 'right')
    expect(panelInfo?.sizes).toEqual([50, 50])
  })
})
