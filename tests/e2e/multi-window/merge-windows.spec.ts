import { test, expect } from '@playwright/test'

test.describe('合并窗口', () => {
  test('应该能够拖入标签到主窗口', async ({ context }) => {
    // 创建主窗口
    const mainPage = await context.newPage()
    await mainPage.goto('/')

    // 打开标签
    await mainPage.click('[data-testid="ai-model-chatgpt"]')

    // 创建独立窗口（模拟拖出）
    await (window as any).electronAPI?.createIndependentWindow({
      tabId: 'test-tab',
      model: { id: 'test', name: 'Test', url: 'https://example.com' }
    })

    // 等待新窗口
    await context.waitForEvent('page')

    // 合并回主窗口
    const pages = context.pages()
    const independentPage = pages[pages.length - 1]

    // 模拟拖入主窗口
    await independentPage.mouse.move(400, 300)
    await independentPage.mouse.down()
    await independentPage.mouse.move(-100, -100) // 移向主窗口
    await independentPage.mouse.up()

    // 验证：独立窗口关闭
    await expect(independentPage).toBeClosed()
  })
})
