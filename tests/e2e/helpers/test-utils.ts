import { Page } from '@playwright/test'

/**
 * 为页面添加 console log 监听和错误捕获
 * 返回清理函数
 */
export function attachConsoleLogger(page: Page, testName: string): () => void {
  const logs: string[] = []

  const consoleHandler = (msg: any) => {
    const type = msg.type()
    const text = msg.text()
    const logMessage = `[${testName}] [${type}] ${text}`

    logs.push(logMessage)

    if (type === 'error') {
      console.error(logMessage)
    } else if (type === 'warning') {
      console.warn(logMessage)
    } else {
      console.log(logMessage)
    }
  }

  const pageErrorHandler = (error: Error) => {
    console.error(`[${testName}] [Page Error]`, error)
    logs.push(`[Page Error] ${error.message}`)
  }

  // 监听 console 消息
  page.on('console', consoleHandler)
  page.on('pageerror', pageErrorHandler)

  // 返回清理函数
  return () => {
    page.off('console', consoleHandler)
    page.off('pageerror', pageErrorHandler)

    // 如果测试失败，打印所有收集的日志
    if (logs.length > 0) {
      console.log(`[${testName}] Collected ${logs.length} console messages`)
    }
  }
}

/**
 * 等待条件满足，带有超时和详细日志
 */
export async function waitForWithLogs<T>(
  page: Page,
  condition: () => Promise<T>,
  description: string,
  timeout = 5000
): Promise<T> {
  const startTime = Date.now()
  console.log(`[E2E] Waiting for: ${description}`)

  try {
    const result = await Promise.race([
      condition(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout waiting for: ${description}`)), timeout)
      )
    ])
    console.log(`[E2E] Condition satisfied: ${description} (${Date.now() - startTime}ms)`)
    return result
  } catch (error) {
    console.error(`[E2E] Failed to wait for: ${description}`)
    throw error
  }
}
