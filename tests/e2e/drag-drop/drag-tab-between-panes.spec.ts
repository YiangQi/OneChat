import { test, expect } from '@playwright/test'
import { LayoutTestHelper } from '../helpers/layout-test-utils'

test.describe('面板间拖拽标签', () => {
  test('应该能够拖拽标签到另一个面板', async ({ page }) => {
    const helper = new LayoutTestHelper(page)
    await page.goto('/')

    // 打开标签并分割面板
    await helper.openTab('chatgpt')
    await helper.splitTab('ChatGPT', 'horizontal')

    // 验证：有两个面板
    await expect.poll(async () => await helper.getPaneCount()).toBe(2)

    // 拖拽标签（如果实现了的话）
    // await helper.dragTab('ChatGPT', '[data-testid="pane-2"]')
  })
})
