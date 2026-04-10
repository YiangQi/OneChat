import { test, expect } from '@playwright/test'
import { LayoutTestHelper } from '../helpers/layout-test-utils'

test.describe('标签切换', () => {
  test('应该能够切换标签', async ({ page }) => {
    const helper = new LayoutTestHelper(page)
    await page.goto('/')

    // 打开两个标签
    await helper.openTab('chatgpt')
    await helper.openTab('claude')

    // 切换到第一个标签
    const tab1 = page.locator('[data-testid="tab-ChatGPT"]')
    await tab1.click()

    // 验证：标签处于激活状态
    await expect(tab1).toHaveClass(/active/)

    // 验证：对应的 webview 可见
    const webview = page.locator('webview[data-tab-id="chatgpt"]')
    await expect(webview).toBeVisible()
  })

  test('关闭标签后应该切换到相邻标签', async ({ page }) => {
    const helper = new LayoutTestHelper(page)
    await page.goto('/')

    // 打开三个标签
    await helper.openTab('chatgpt')
    await helper.openTab('claude')
    await helper.openTab('gemini')

    // 激活中间的标签
    await page.click('[data-testid="tab-Claude"]')

    // 关闭中间标签
    await helper.closeTab('Claude')

    // 验证：激活状态转移到另一个标签
    const activeTab = await helper.getActiveTab()
    expect(await activeTab.count()).toBeGreaterThan(0)
  })
})
