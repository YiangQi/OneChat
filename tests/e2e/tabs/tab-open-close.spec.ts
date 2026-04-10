import { test, expect } from '@playwright/test'
import { LayoutTestHelper } from '../helpers/layout-test-utils'

test.describe('标签打开和关闭', () => {
  test('应该能够打开新标签', async ({ page }) => {
    const helper = new LayoutTestHelper(page)
    await page.goto('/')

    const initialCount = await helper.getTabCount()
    await helper.openTab('chatgpt')

    const newCount = await helper.getTabCount()
    expect(newCount).toBe(initialCount + 1)
  })

  test('应该能够关闭标签', async ({ page }) => {
    const helper = new LayoutTestHelper(page)
    await page.goto('/')

    await helper.openTab('chatgpt')
    const beforeCount = await helper.getTabCount()

    await helper.closeTab('ChatGPT')
    const afterCount = await helper.getTabCount()

    expect(afterCount).toBe(beforeCount - 1)
  })

  test('不应该打开重复的标签', async ({ page }) => {
    const helper = new LayoutTestHelper(page)
    await page.goto('/')

    // 打开同一个模型两次
    await helper.openTab('chatgpt')
    const firstCount = await helper.getTabCount()

    await helper.openTab('chatgpt')
    const secondCount = await helper.getTabCount()

    expect(secondCount).toBe(firstCount)
  })
})
