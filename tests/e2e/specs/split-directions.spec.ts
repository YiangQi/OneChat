import { test, expect, type Page } from '@playwright/test'
import { launchElectronApp, getMainWindow } from '../helpers/electron'

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
    const parent = panelStore.rootPanel?.direction ? panelStore.rootPanel : null
    if (!parent) return null

    return {
      direction: parent.direction,
      childCount: parent.children?.length || 0,
      sizes: parent.sizes || []
    }
  }, position)
}

async function containerSplitAndReadRoot(page: Page, position: DropPosition) {
  await openTabs(page, 2)

  const box = await page.locator('.split-layout-container').boundingBox()
  if (!box) return null

  const pointByPosition = {
    left: { x: box.x + 4, y: box.y + box.height / 2 },
    right: { x: box.x + box.width - 4, y: box.y + box.height / 2 },
    top: { x: box.x + box.width / 2, y: box.y + 4 },
    bottom: { x: box.x + box.width / 2, y: box.y + box.height - 4 }
  }
  const point = pointByPosition[position]

  const tabInfo = await page.evaluate(() => {
    // @ts-ignore
    const { panelStore, tabsStore } = window.$stores || {}
    if (!panelStore || !tabsStore || tabsStore.tabs.length < 2) return null

    panelStore.isDraggingGlobal = true
    return {
      tabId: tabsStore.tabs[0].id,
      sourcePanelId: 'panel-default'
    }
  })

  if (!tabInfo) return null

  return page.evaluate((tabInfo) => {
    // @ts-ignore
    const { panelStore } = window.$stores || {}
    const container = document.querySelector('.split-layout-container')
    if (!container) return null

    const rect = container.getBoundingClientRect()
    panelStore.handleContainerDragOver({
      clientX: tabInfo.point.x,
      clientY: tabInfo.point.y,
      preventDefault: () => {}
    }, rect)

    if (panelStore.dragPreview.targetScope !== 'container') {
      return {
        previewScope: panelStore.dragPreview.targetScope,
        previewPosition: panelStore.dragPreview.position
      }
    }

    panelStore.handleContainerDrop(tabInfo.tabId, panelStore.dragPreview.position)

    const root = panelStore.rootPanel
    return {
      direction: root.direction,
      childCount: root.children?.length || 0,
      leafCount: panelStore.flatPanels.length,
      targetScope: panelStore.dragPreview.targetScope,
      tabCounts: panelStore.flatPanels.map((panel: any) => panel.tabs.length)
    }
  }, { ...tabInfo, point })
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

  for (const position of ['left', 'right', 'top', 'bottom'] as const) {
    test(`container ${position} edge drop creates root split`, async () => {
      const panelInfo = await containerSplitAndReadRoot(mainWindow, position)

      expect(panelInfo?.direction).toBe(position === 'left' || position === 'right' ? 'vertical' : 'horizontal')
      expect(panelInfo?.childCount).toBe(2)
      expect(panelInfo?.leafCount).toBe(2)
      expect(panelInfo?.tabCounts).toEqual([1, 1])
    })
  }
})
