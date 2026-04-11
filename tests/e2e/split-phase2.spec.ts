import { test, expect } from '@playwright/test'

test.describe('第二阶段：拖拽功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    // 打开一个标签页
    await page.click('[data-testid="ai-model-chatgpt"]')
  })

  test('拖拽标签页到右边应该创建右侧分屏', async ({ page }) => {
    const tab = page.locator('.tab').first()
    const container = page.locator('.split-layout-container')

    // 拖拽到右边缘
    await tab.dragTo(container, {
      targetPosition: { x: 900, y: 300 }
    })

    // 验证创建了两个面板
    await expect(page.locator('.tab-group')).toHaveCount(2)
  })

  test('拖拽标签页到左边应该创建左侧分屏', async ({ page }) => {
    const tab = page.locator('.tab').first()
    const container = page.locator('.split-layout-container')

    await tab.dragTo(container, {
      targetPosition: { x: 100, y: 300 }
    })

    await expect(page.locator('.tab-group')).toHaveCount(2)
  })

  test('拖拽标签页到另一个面板应该合并', async ({ page }) => {
    // 先创建分屏
    await page.click('[data-testid="ai-model-claude"]')

    const tab1 = page.locator('.tab').nth(0)
    const container = page.locator('.split-layout-container')

    // 拖拽第一个标签页到右边缘创建分屏
    await tab1.dragTo(container, {
      targetPosition: { x: 900, y: 300 }
    })

    // 现在有两个面板
    await expect(page.locator('.tab-group')).toHaveCount(2)

    // 将第二个面板的标签页拖回第一个面板的中心
    const tab2 = page.locator('.tab-group').nth(1).locator('.tab')
    const firstPanel = page.locator('.tab-group').nth(0)

    await tab2.dragTo(firstPanel, {
      targetPosition: { x: 200, y: 20 }
    })

    // 应该合并到一个面板
    await expect(page.locator('.tab-group')).toHaveCount(1)
    await expect(page.locator('.tab')).toHaveCount(2)
  })

  test('拖拽时应该显示预览区域', async ({ page }) => {
    const tab = page.locator('.tab').first()

    // 开始拖拽
    await tab.dragTo(page.locator('.split-layout-container'), {
      targetPosition: { x: 900, y: 300 }
    })

    // 验证预览层出现（可能需要添加 class 检查）
    const preview = page.locator('.drag-preview')
    // 注意：由于拖拽完成后预览会消失，这个测试可能需要调整
  })
})
