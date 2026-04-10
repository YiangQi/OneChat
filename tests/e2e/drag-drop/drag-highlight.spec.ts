import { test, expect } from '@playwright/test'

test.describe('拖拽高亮反馈', () => {
  test('拖拽时应该显示高亮', async ({ page }) => {
    await page.goto('/')

    // 打开两个标签
    await page.click('[data-testid="ai-model-chatgpt"]')
    await page.click('[data-testid="ai-model-claude"]')

    const tab = page.locator('[data-testid="tab-ChatGPT"]')

    // 模拟拖拽
    await tab.dragTo(page.locator('[data-testid="tab-Claude"]'), {
      force: true,
      targetPosition: { x: 50, y: 10 }
    })

    // 验证：高亮显示
    const dropIndicator = page.locator('.lm_drop_target_indicator')
    await expect(dropIndicator).toBeVisible()
  })
})
