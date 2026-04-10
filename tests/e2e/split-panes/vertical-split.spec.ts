import { test, expect } from '@playwright/test'

test.describe('垂直分割面板', () => {
  test('应该能够垂直分割面板', async ({ page }) => {
    await page.goto('/')

    // 打开第一个标签
    await page.click('[data-testid="ai-model-chatgpt"]')

    // 右键点击标签
    const tab = page.locator('[data-testid="tab-ChatGPT"]')
    await tab.click({ button: 'right' })

    // 点击"向下分割"选项
    await page.click('[data-testid="context-menu-split-down"]')

    // 验证：两个面板上下排列
    const panes = page.locator('[data-testid^="pane-"]')
    await expect(panes).toHaveCount(2)

    // 验证：水平 splitter 存在
    const splitters = page.locator('.lm_splitter')
    await expect(splitters).toHaveCount(1)
  })
})
