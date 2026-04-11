import { test, expect } from '@playwright/test'

test.describe('第一阶段：基础分屏功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
  })

  test('应该显示一个默认面板', async ({ page }) => {
    await expect(page.locator('.tab-group')).toHaveCount(1)
  })

  test('打开 AI 模型后应该在面板中显示', async ({ page }) => {
    // 点击侧边栏的 ChatGPT
    await page.click('[data-testid="ai-model-chatgpt"]')

    // 验证标签页出现
    await expect(page.locator('.tab')).toHaveCount(1)
    await expect(page.locator('.tab')).toContainText('ChatGPT')
  })

  test('面板应该可以调整大小', async ({ page }) => {
    await page.click('[data-testid="ai-model-chatgpt"]')

    // 先通过 store API 创建分屏（测试用）
    await page.evaluate(() => {
      const { usePanelStore } = window.$stores || {}
      if (usePanelStore) {
        const panelStore = usePanelStore()
        panelStore.splitPanel('panel-default', 'after', 'horizontal')
      }
    })

    await expect(page.locator('.tab-group')).toHaveCount(2)

    const leftPanel = page.locator('.tab-group').first()
    const initialSize = await leftPanel.boundingBox()

    // 拖动分隔条
    const resizer = page.locator('.splitpanes__resizer')
    if (await resizer.count() > 0) {
      await resizer.first().dragTo(leftPanel, {
        targetPosition: { x: 100, y: 0 }
      })

      const newSize = await leftPanel.boundingBox()
      expect(newSize?.width).not.toBe(initialSize?.width)
    }
  })
})
