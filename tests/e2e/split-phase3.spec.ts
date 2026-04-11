import { test, expect } from '@playwright/test'

test.describe('第三阶段：完善功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
  })

  test('关闭最后一个标签页后面板应该自动合并', async ({ page }) => {
    // 打开两个标签页
    await page.click('[data-testid="ai-model-chatgpt"]')
    await page.click('[data-testid="ai-model-claude"]')

    // 创建分屏
    const tab1 = page.locator('.tab').nth(0)
    await tab1.dragTo(page.locator('.split-layout-container'), {
      targetPosition: { x: 900, y: 300 }
    })

    await expect(page.locator('.tab-group')).toHaveCount(2)

    // 关闭第一个面板的标签页
    await page.locator('.tab-group').nth(1).locator('.tab-close').click()

    // 面板应该自动合并
    await expect(page.locator('.tab-group')).toHaveCount(1)
  })

  test('多级分屏应该正常工作', async ({ page }) => {
    // 打开三个标签页
    await page.click('[data-testid="ai-model-chatgpt"]')
    await page.click('[data-testid="ai-model-claude"]')
    await page.click('[data-testid="ai-model-gemini"]')

    // 第一次分屏（水平）
    const tab1 = page.locator('.tab').nth(0)
    await tab1.dragTo(page.locator('.split-layout-container'), {
      targetPosition: { x: 900, y: 300 }
    })

    await expect(page.locator('.tab-group')).toHaveCount(2)

    // 第二次分屏（在右面板垂直分屏）
    const tab2 = page.locator('.tab-group').nth(1).locator('.tab')
    await tab2.dragTo(page.locator('.tab-group').nth(1), {
      targetPosition: { x: 200, y: 700 }
    })

    // 应该有三个面板
    await expect(page.locator('.tab-group')).toHaveCount(3)
  })

  test('布局不应该在页面刷新后保存', async ({ page }) => {
    // 创建分屏
    await page.click('[data-testid="ai-model-chatgpt"]')
    const tab1 = page.locator('.tab').nth(0)
    await tab1.dragTo(page.locator('.split-layout-container'), {
      targetPosition: { x: 900, y: 300 }
    })

    await expect(page.locator('.tab-group')).toHaveCount(2)

    // 刷新页面
    await page.reload()

    // 应该恢复到默认状态（只有一个面板）
    await expect(page.locator('.tab-group')).toHaveCount(1)
  })
})
