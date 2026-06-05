import { test, expect } from '@playwright/test'

// 使用 Playwright 连接到已运行的 Electron 应用进行调试
// 需要先运行 npm run dev

test.describe('Debug: Inspect running Electron app', () => {
  test.skip('connect to running app and check sidebar', async ({ page }) => {
    // 连接到开发服务器
    await page.goto('http://localhost:5173')

    // 等待页面加载
    await page.waitForLoadState('domcontentloaded')

    console.log('Page title:', await page.title())
    console.log('Page URL:', page.url())

    // 截图
    await page.screenshot({ path: 'debug-screenshot.png' })

    // 检查 ActivityBar
    const activityBar = page.locator('.activity-bar')
    console.log('ActivityBar exists:', await activityBar.count())

    // 检查 Sidebar
    const sidebar = page.locator('.sidebar')
    console.log('Sidebar exists:', await sidebar.count())

    // 检查 AI 列表
    const aiList = page.locator('.ai-list')
    console.log('AIList exists:', await aiList.count())

    // 检查 AI items
    const aiItems = page.locator('.ai-item')
    const aiItemCount = await aiItems.count()
    console.log('AI Items count:', aiItemCount)

    if (aiItemCount > 0) {
      for (let i = 0; i < Math.min(aiItemCount, 5); i++) {
        const text = await aiItems.nth(i).textContent()
        console.log(`  AI Item ${i}:`, text)
      }
    }

    // 检查 console 错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser error:', msg.text())
      }
    })

    // 获取页面 HTML 结构
    const appContainer = page.locator('.app-container')
    if (await appContainer.count() > 0) {
      console.log('App container HTML:', await appContainer.innerHTML())
    }

    // 等待以便观察
    await page.waitForTimeout(5000)
  })
})
