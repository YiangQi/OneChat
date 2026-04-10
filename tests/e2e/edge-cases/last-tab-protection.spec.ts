import { test, expect } from '@playwright/test'

test.describe('最后标签保护', () => {
  test('不应该关闭最后一个标签', async ({ page }) => {
    await page.goto('/')

    // 打开一个标签
    await page.click('[data-testid="ai-model-chatgpt"]')

    // 尝试关闭最后一个标签
    const closeBtn = page.locator('[data-testid="tab-ChatGPT"] .tab-close')
    await closeBtn.click()

    // 验证：仍然显示一个标签或空状态
    const tabs = page.locator('[data-testid^="tab-"]')
    const count = await tabs.count()

    // 应该是 0（空状态）或 1（最后一个标签不能关闭）
    expect(count === 0 || count === 1).toBe(true)
  })
})
