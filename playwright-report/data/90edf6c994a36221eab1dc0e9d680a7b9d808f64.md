# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: basic-interactions.spec.ts >> Basic Interactions (E2E) >> should show TabBar after opening a tab
- Location: tests\e2e\basic-interactions.spec.ts:91:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.tab-bar')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.tab-bar')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - img [ref=e7] [cursor=pointer]
    - img [ref=e12] [cursor=pointer]
  - generic [ref=e16]:
    - generic [ref=e17] [cursor=pointer]:
      - img "ChatGPT" [ref=e18]
      - generic [ref=e19]: ChatGPT
    - generic [ref=e20] [cursor=pointer]:
      - img "ChatGLM" [ref=e21]
      - generic [ref=e22]: ChatGLM
    - generic [ref=e23] [cursor=pointer]:
      - img "Claude" [ref=e24]
      - generic [ref=e25]: Claude
    - generic [ref=e26] [cursor=pointer]:
      - img "DeepSeek" [ref=e27]
      - generic [ref=e28]: DeepSeek
    - generic [ref=e29] [cursor=pointer]:
      - img "DouBao" [ref=e30]
      - generic [ref=e31]: DouBao
    - generic [ref=e32] [cursor=pointer]:
      - img "Gemini" [ref=e33]
      - generic [ref=e34]: Gemini
    - generic [ref=e35] [cursor=pointer]:
      - img "Grok" [ref=e36]
      - generic [ref=e37]: Grok
    - generic [ref=e38] [cursor=pointer]:
      - img "Kimi" [ref=e39]
      - generic [ref=e40]: Kimi
    - generic [ref=e41] [cursor=pointer]:
      - img "Tongyi" [ref=e42]
      - generic [ref=e43]: Tongyi
    - generic [ref=e44] [cursor=pointer]:
      - img "YuanBao" [ref=e45]
      - generic [ref=e46]: YuanBao
  - generic [ref=e49]:
    - paragraph [ref=e50]: "布局系统错误: Failed to initialize layout system"
    - button "重试" [ref=e51] [cursor=pointer]
  - button [ref=e53] [cursor=pointer]:
    - img [ref=e55]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | import { launchElectronApp, getMainWindow } from './helpers/electron'
  3   | 
  4   | /**
  5   |  * Electron E2E Tests
  6   |  *
  7   |  * These tests require the app to be built before running:
  8   |  * npm run build
  9   |  * npm run test:e2e
  10  |  *
  11  |  * Or skip build and test against dev build:
  12  |  * E2E_SKIP_BUILD=1 npm run test:e2e
  13  |  */
  14  | 
  15  | test.describe('Basic Interactions (E2E)', () => {
  16  |   let electronApp: Awaited<ReturnType<typeof launchElectronApp>>
  17  |   let mainWindow: Awaited<ReturnType<typeof getMainWindow>>
  18  | 
  19  |   test.beforeAll(async () => {
  20  |     // Launch Electron app
  21  |     electronApp = await launchElectronApp()
  22  |     mainWindow = await getMainWindow(electronApp)
  23  |   })
  24  | 
  25  |   test.afterAll(async () => {
  26  |     await electronApp.close()
  27  |   })
  28  | 
  29  |   test('should launch the application', async () => {
  30  |     // Verify the app launched successfully
  31  |     expect(mainWindow).toBeTruthy()
  32  |     expect(await mainWindow.title()).toBeTruthy()
  33  |   })
  34  | 
  35  |   test('should show ActivityBar on startup', async () => {
  36  |     // Check for ActivityBar presence
  37  |     const activityBar = mainWindow.locator('.activity-bar')
  38  |     await expect(activityBar).toBeVisible()
  39  | 
  40  |     // Check for AI module icon
  41  |     const aiIcon = mainWindow.locator('.activity-item').first()
  42  |     await expect(aiIcon).toBeVisible()
  43  |   })
  44  | 
  45  |   test('should show Sidebar when AI module is active', async () => {
  46  |     // Check for Sidebar presence
  47  |     const sidebar = mainWindow.locator('.sidebar')
  48  |     await expect(sidebar).toBeVisible()
  49  | 
  50  |     // Check for AI list items (after loading)
  51  |     await mainWindow.waitForTimeout(2000) // Wait for models to load
  52  | 
  53  |     const aiItems = mainWindow.locator('.ai-item')
  54  |     const count = await aiItems.count()
  55  | 
  56  |     // Should have at least some AI models
  57  |     expect(count).toBeGreaterThan(0)
  58  |   })
  59  | 
  60  |   test('should display AI model names in sidebar', async () => {
  61  |     await mainWindow.waitForTimeout(2000) // Wait for models to load
  62  | 
  63  |     // Check for common AI model names
  64  |     const content = await mainWindow.locator('.sidebar').textContent()
  65  | 
  66  |     // Verify at least one known AI model is displayed
  67  |     const knownModels = ['ChatGPT', 'Claude', 'DeepSeek', 'Gemini', '文心一言']
  68  |     const hasKnownModel = knownModels.some(model => content?.includes(model))
  69  | 
  70  |     expect(hasKnownModel).toBeTruthy()
  71  |   })
  72  | 
  73  |   test('should open a tab when clicking AI model', async () => {
  74  |     await mainWindow.waitForTimeout(2000) // Wait for models to load
  75  | 
  76  |     // Get initial tab count
  77  |     const initialTabs = await mainWindow.locator('.tab').count()
  78  | 
  79  |     // Click on first AI model
  80  |     const firstAIItem = mainWindow.locator('.ai-item').first()
  81  |     await firstAIItem.click()
  82  | 
  83  |     // Wait for tab to open
  84  |     await mainWindow.waitForTimeout(500)
  85  | 
  86  |     // Check that a new tab was opened
  87  |     const tabs = await mainWindow.locator('.tab').count()
  88  |     expect(tabs).toBeGreaterThan(initialTabs)
  89  |   })
  90  | 
  91  |   test('should show TabBar after opening a tab', async () => {
  92  |     await mainWindow.waitForTimeout(2000) // Wait for models to load
  93  | 
  94  |     // Click on first AI model to open a tab
  95  |     const firstAIItem = mainWindow.locator('.ai-item').first()
  96  |     await firstAIItem.click()
  97  |     await mainWindow.waitForTimeout(500)
  98  | 
  99  |     // Check for TabBar presence
  100 |     const tabBar = mainWindow.locator('.tab-bar')
> 101 |     await expect(tabBar).toBeVisible()
      |                          ^ Error: expect(locator).toBeVisible() failed
  102 |   })
  103 | 
  104 |   test('should have resize handle on sidebar', async () => {
  105 |     const resizeHandle = mainWindow.locator('.resize-handle')
  106 |     await expect(resizeHandle).toBeVisible()
  107 |   })
  108 | 
  109 |   test('should have webview container for tabs', async () => {
  110 |     await mainWindow.waitForTimeout(2000) // Wait for models to load
  111 | 
  112 |     // Open a tab first
  113 |     const firstAIItem = mainWindow.locator('.ai-item').first()
  114 |     await firstAIItem.click()
  115 |     await mainWindow.waitForTimeout(500)
  116 | 
  117 |     // Check for webview container
  118 |     const webviewContainer = mainWindow.locator('.webview-container')
  119 |     await expect(webviewContainer).toBeVisible()
  120 |   })
  121 | })
  122 | 
  123 | test.describe('Theme Switching (E2E)', () => {
  124 |   let electronApp: Awaited<ReturnType<typeof launchElectronApp>>
  125 |   let mainWindow: Awaited<ReturnType<typeof getMainWindow>>
  126 | 
  127 |   test.beforeAll(async () => {
  128 |     electronApp = await launchElectronApp()
  129 |     mainWindow = await getMainWindow(electronApp)
  130 |   })
  131 | 
  132 |   test.afterAll(async () => {
  133 |     await electronApp.close()
  134 |   })
  135 | 
  136 |   test('should start with light theme', async () => {
  137 |     // Check if app has light theme class or default styles
  138 |     const body = mainWindow.locator('body')
  139 |     await expect(body).toBeVisible()
  140 |   })
  141 | 
  142 |   test('should have proper CSS variables for theming', async () => {
  143 |     // Check for CSS custom properties
  144 |     const accentColor = await mainWindow.evaluate(() => {
  145 |       const styles = getComputedStyle(document.documentElement)
  146 |       return styles.getPropertyValue('--accent-color')
  147 |     })
  148 | 
  149 |     expect(accentColor).toBeTruthy()
  150 |   })
  151 | })
  152 | 
  153 | test.describe('Window Management (E2E)', () => {
  154 |   let electronApp: Awaited<ReturnType<typeof launchElectronApp>>
  155 |   let mainWindow: Awaited<ReturnType<typeof getMainWindow>>
  156 | 
  157 |   test.beforeAll(async () => {
  158 |     electronApp = await launchElectronApp()
  159 |     mainWindow = await getMainWindow(electronApp)
  160 |   })
  161 | 
  162 |   test.afterAll(async () => {
  163 |     await electronApp.close()
  164 |   })
  165 | 
  166 |   test('should have proper window bounds', async () => {
  167 |     const bounds = await mainWindow.evaluate(() => ({
  168 |       width: window.innerWidth,
  169 |       height: window.innerHeight
  170 |     }))
  171 | 
  172 |     // Window should be reasonably sized
  173 |     expect(bounds.width).toBeGreaterThan(800)
  174 |     expect(bounds.height).toBeGreaterThan(600)
  175 |   })
  176 | })
  177 | 
```