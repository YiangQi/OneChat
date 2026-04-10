import { test, expect } from '@playwright/test'

test.describe('创建独立窗口', () => {
  test('应该能够拖出标签创建新窗口', async ({ page, context }) => {
    await page.goto('/')

    // 打开标签
    await page.click('[data-testid="ai-model-chatgpt"]')

    const tab = page.locator('[data-testid="tab-ChatGPT"]')
    const tabBox = await tab.boundingBox()

    if (!tabBox) throw new Error('Tab not found')

    // 拖到窗口外（右下角）
    await page.mouse.move(tabBox.x + 50, tabBox.y + 10)
    await page.mouse.down()

    // 模拟拖出窗口边界
    await page.mouse.move(1500, 900, { steps: 10 })
    await page.mouse.up()

    // 等待新窗口打开
    await context.waitForEvent('page', { timeout: 5000 })

    const pages = context.pages()
    expect(pages.length).toBeGreaterThan(1)

    // 验证新窗口
    const newPage = pages[pages.length - 1]
    await expect(newPage.locator('webview')).toBeVisible()
  })
})
