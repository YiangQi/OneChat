import { test, expect } from '@playwright/test'

test.describe('无效拖拽处理', () => {
  test('拖拽到无效位置应该弹回', async ({ page }) => {
    await page.goto('/')

    // 打开标签
    await page.click('[data-testid="ai-model-chatgpt"]')

    const tab = page.locator('[data-testid="tab-ChatGPT"]')

    // 尝试拖拽到无效位置
    await tab.dragTo(page.locator('body'), {
      targetPosition: { x: 10, y: 10 }
    })

    // 验证：标签仍然存在
    await expect(tab).toBeVisible()
  })
})
