import { test, expect } from '@playwright/test'

test.describe('水平分割面板', () => {
  test('应该能够水平分割面板', async ({ page }) => {
    await page.goto('/')

    // 打开第一个标签
    await page.click('[data-testid="ai-model-chatgpt"]')

    // 右键点击标签
    const tab = page.locator('[data-testid="tab-ChatGPT"]')
    await tab.click({ button: 'right' })

    // 点击"向右分割"选项
    await page.click('[data-testid="context-menu-split-right"]')

    // 验证：两个面板并排显示
    const panes = page.locator('[data-testid^="pane-"]')
    await expect(panes).toHaveCount(2)

    // 验证：splitter 存在
    await expect(page.locator('.lm_splitter')).toBeVisible()
  })
})
