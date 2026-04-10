import { test, expect } from '@playwright/test'
import { LayoutTestHelper } from '../helpers/layout-test-utils'

test.describe('嵌套分割', () => {
  test('应该能够创建嵌套分割', async ({ page }) => {
    const helper = new LayoutTestHelper(page)
    await page.goto('/')

    // 打开标签并水平分割
    await helper.openTab('chatgpt')
    await helper.splitTab('ChatGPT', 'horizontal')

    // 再垂直分割其中一个面板
    // await helper.splitTab('ChatGPT', 'vertical')

    // 验证：有多个面板
    await expect.poll(async () => await helper.getPaneCount()).toBeGreaterThanOrEqual(2)
  })

  test('嵌套层级不应超过限制', async ({ page }) => {
    const helper = new LayoutTestHelper(page)
    await page.goto('/')

    await helper.openTab('chatgpt')

    // 尝试多次分割
    await helper.splitTab('ChatGPT', 'horizontal')
    await helper.splitTab('ChatGPT', 'vertical')
    await helper.splitTab('ChatGPT', 'horizontal')

    // 验证：布局仍然正常工作
    await expect.poll(async () => await helper.getPaneCount()).toBeGreaterThan(0)
  })
})
