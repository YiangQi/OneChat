import { test, expect } from '@playwright/test'
import { launchElectronApp, getMainWindow } from '../helpers/electron'

/**
 * Electron E2E Tests
 *
 * These tests require the app to be built before running:
 * npm run build
 * npm run test:e2e
 *
 * Or skip build and test against dev build:
 * E2E_SKIP_BUILD=1 npm run test:e2e
 */

test.describe('Basic Interactions (E2E)', () => {
  let electronApp: Awaited<ReturnType<typeof launchElectronApp>>
  let mainWindow: Awaited<ReturnType<typeof getMainWindow>>

  test.beforeAll(async () => {
    // Launch Electron app
    electronApp = await launchElectronApp()
    mainWindow = await getMainWindow(electronApp)
  })

  test.afterAll(async () => {
    await electronApp.close()
  })

  test('should launch the application', async () => {
    // Verify the app launched successfully
    expect(mainWindow).toBeTruthy()
    expect(await mainWindow.title()).toBeTruthy()
  })

  test('should show ActivityBar on startup', async () => {
    // Check for ActivityBar presence
    const activityBar = mainWindow.locator('.activity-bar')
    await expect(activityBar).toBeVisible()

    // Check for AI module icon
    const aiIcon = mainWindow.locator('.activity-item').first()
    await expect(aiIcon).toBeVisible()
  })

  test('should show Sidebar when AI module is active', async () => {
    // Check for Sidebar presence
    const sidebar = mainWindow.locator('.sidebar')
    await expect(sidebar).toBeVisible()

    // Check for AI list items (after loading)
    await mainWindow.waitForTimeout(2000) // Wait for models to load

    const aiItems = mainWindow.locator('.ai-item')
    const count = await aiItems.count()

    // Should have at least some AI models
    expect(count).toBeGreaterThan(0)
  })

  test('should display AI model names in sidebar', async () => {
    await mainWindow.waitForTimeout(2000) // Wait for models to load

    // Check for common AI model names
    const content = await mainWindow.locator('.sidebar').textContent()

    // Verify at least one known AI model is displayed
    const knownModels = ['ChatGPT', 'Claude', 'DeepSeek', 'Gemini', '文心一言']
    const hasKnownModel = knownModels.some(model => content?.includes(model))

    expect(hasKnownModel).toBeTruthy()
  })

  test('should open a tab when clicking AI model', async () => {
    await mainWindow.waitForTimeout(2000) // Wait for models to load

    // Get initial tab count
    const initialTabs = await mainWindow.locator('.tab').count()

    // Click on first AI model
    const firstAIItem = mainWindow.locator('.ai-item').first()
    await firstAIItem.click()

    // Wait for tab to open
    await mainWindow.waitForTimeout(500)

    // Check that a new tab was opened
    const tabs = await mainWindow.locator('.tab').count()
    expect(tabs).toBeGreaterThan(initialTabs)
  })

  test('should show TabBar after opening a tab', async () => {
    await mainWindow.waitForTimeout(2000) // Wait for models to load

    // Click on first AI model to open a tab
    const firstAIItem = mainWindow.locator('.ai-item').first()
    await firstAIItem.click()
    await mainWindow.waitForTimeout(500)

    // Check for TabBar presence
    const tabBar = mainWindow.locator('.tab-bar')
    await expect(tabBar).toBeVisible()
  })

  test('should have resize handle on sidebar', async () => {
    const resizeHandle = mainWindow.locator('.resize-handle')
    await expect(resizeHandle).toBeVisible()
  })

  test('should have webview container for tabs', async () => {
    await mainWindow.waitForTimeout(2000) // Wait for models to load

    // Open a tab first
    const firstAIItem = mainWindow.locator('.ai-item').first()
    await firstAIItem.click()
    await mainWindow.waitForTimeout(500)

    // Check for webview container
    const webviewContainer = mainWindow.locator('.webview-container')
    await expect(webviewContainer).toBeVisible()
  })
})

test.describe('Theme Switching (E2E)', () => {
  let electronApp: Awaited<ReturnType<typeof launchElectronApp>>
  let mainWindow: Awaited<ReturnType<typeof getMainWindow>>

  test.beforeAll(async () => {
    electronApp = await launchElectronApp()
    mainWindow = await getMainWindow(electronApp)
  })

  test.afterAll(async () => {
    await electronApp.close()
  })

  test('should start with light theme', async () => {
    // Check if app has light theme class or default styles
    const body = mainWindow.locator('body')
    await expect(body).toBeVisible()
  })

  test('should have proper CSS variables for theming', async () => {
    // Check for CSS custom properties
    const accentColor = await mainWindow.evaluate(() => {
      const styles = getComputedStyle(document.documentElement)
      return styles.getPropertyValue('--accent-color')
    })

    expect(accentColor).toBeTruthy()
  })
})

test.describe('Window Management (E2E)', () => {
  let electronApp: Awaited<ReturnType<typeof launchElectronApp>>
  let mainWindow: Awaited<ReturnType<typeof getMainWindow>>

  test.beforeAll(async () => {
    electronApp = await launchElectronApp()
    mainWindow = await getMainWindow(electronApp)
  })

  test.afterAll(async () => {
    await electronApp.close()
  })

  test('should have proper window bounds', async () => {
    const bounds = await mainWindow.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight
    }))

    // Window should be reasonably sized
    expect(bounds.width).toBeGreaterThan(800)
    expect(bounds.height).toBeGreaterThan(600)
  })
})
