import { test, expect } from '@playwright/test'
import { launchElectronApp, getMainWindow } from './helpers/electron'

async function resetComposerState(page: Awaited<ReturnType<typeof getMainWindow>>) {
  await page.waitForFunction(() => {
    // @ts-ignore
    return Boolean(window.$stores?.composerStore)
  }, { timeout: 5000 })

  await page.evaluate(() => {
    localStorage.removeItem('composer-state')
    // @ts-ignore
    const composerStore = window.$stores?.composerStore
    composerStore?.setCollapsed(false)
    composerStore?.setHeight(180)
    composerStore?.setDraftText('')
    composerStore?.setTargetMode('active-tab')
  })
}

test.describe('Bottom Composer', () => {
  let electronApp: Awaited<ReturnType<typeof launchElectronApp>>
  let mainWindow: Awaited<ReturnType<typeof getMainWindow>>

  test.beforeEach(async () => {
    electronApp = await launchElectronApp()
    mainWindow = await getMainWindow(electronApp)
    await resetComposerState(mainWindow)
  })

  test.afterEach(async () => {
    await electronApp.close()
  })

  test('stays below the split workspace and can collapse', async () => {
    const composer = mainWindow.locator('[data-testid="bottom-composer"]')
    const split = mainWindow.locator('.split-layout-container')

    await expect(composer).toBeVisible()
    await expect(mainWindow.locator('[data-testid="composer-textarea"]')).toHaveAttribute('placeholder', '向 OneChat 提问...')

    const initial = await mainWindow.evaluate(() => {
      const splitRect = document.querySelector('.split-layout-container')?.getBoundingClientRect()
      const composerRect = document.querySelector('[data-testid="bottom-composer"]')?.getBoundingClientRect()
      return {
        splitBottom: splitRect?.bottom ?? 0,
        composerTop: composerRect?.top ?? 0,
        composerHeight: composerRect?.height ?? 0
      }
    })

    expect(initial.splitBottom).toBeLessThanOrEqual(initial.composerTop + 1)

    await mainWindow.getByRole('button', { name: '收起输入框' }).click()
    await expect(mainWindow.locator('[data-testid="composer-collapsed-bar"]')).toBeVisible()
    await mainWindow.locator('[data-testid="composer-collapsed-bar"]').click()
    await expect(composer).toBeVisible()
    await expect(split).toBeVisible()
  })

  test('does not let webviews overlap the composer', async () => {
    await mainWindow.waitForTimeout(1000)
    await mainWindow.locator('.ai-item').first().click()
    await expect(mainWindow.locator('.webview-container')).toBeVisible({ timeout: 5000 })

    const boxes = await mainWindow.evaluate(() => {
      const webviewRect = document.querySelector('.webview-container')?.getBoundingClientRect()
      const composerRect = document.querySelector('[data-testid="bottom-composer"]')?.getBoundingClientRect()
      return {
        webviewBottom: webviewRect?.bottom ?? 0,
        composerTop: composerRect?.top ?? 0
      }
    })

    expect(boxes.webviewBottom).toBeLessThanOrEqual(boxes.composerTop + 1)
  })

  test('can resize while dragging over an open webview', async () => {
    await mainWindow.waitForTimeout(1000)
    await mainWindow.locator('.ai-item').first().click()
    await expect(mainWindow.locator('.webview-container')).toBeVisible({ timeout: 5000 })

    const composer = mainWindow.locator('[data-testid="bottom-composer"]')
    const initialHeight = await composer.boundingBox().then(box => box?.height ?? 0)
    const handleBox = await mainWindow.locator('[data-testid="composer-resize-handle"]').boundingBox()
    const webviewBox = await mainWindow.locator('.webview-container').boundingBox()

    expect(handleBox).toBeTruthy()
    expect(webviewBox).toBeTruthy()

    await mainWindow.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2)
    await mainWindow.mouse.down()
    await mainWindow.mouse.move(webviewBox!.x + webviewBox!.width / 2, webviewBox!.y + webviewBox!.height - 80)
    await mainWindow.mouse.up()

    await expect.poll(async () => composer.boundingBox().then(box => box?.height ?? 0)).toBeGreaterThan(initialHeight)
  })
})
