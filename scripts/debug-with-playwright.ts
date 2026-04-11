// 使用 Playwright 调试运行中的应用
import { chromium } from 'playwright'

async function debugApp() {
  console.log('启动 Playwright 调试...')

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000 // 慢速操作以便观察
  })

  const page = await browser.newPage()

  // 监听 console 消息
  page.on('console', msg => {
    const type = msg.type()
    const text = msg.text()
    if (type === 'error') {
      console.error('🔴 Browser Error:', text)
    } else if (type === 'warning') {
      console.warn('⚠️  Browser Warning:', text)
    } else {
      console.log(`📋 Browser [${type}]:`, text)
    }
  })

  // 监听页面错误
  page.on('pageerror', error => {
    console.error('🔴 Page Error:', error.message)
  })

  try {
    console.log('📡 连接到 http://localhost:5173')
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' })

    // 等待页面加载
    await page.waitForTimeout(2000)

    console.log('📄 Page URL:', page.url())
    console.log('📄 Page Title:', await page.title())

    // 检查 ActivityBar
    const activityBar = await page.locator('.activity-bar').count()
    console.log('✅ ActivityBar:', activityBar > 0 ? '存在' : '不存在')

    // 检查 Sidebar
    const sidebar = await page.locator('.sidebar').count()
    console.log('✅ Sidebar:', sidebar > 0 ? '存在' : '不存在')

    // 检查 AI List
    const aiList = await page.locator('.ai-list').count()
    console.log('✅ AIList:', aiList > 0 ? '存在' : '不存在')

    // 检查 AI Items
    const aiItems = await page.locator('.ai-item').count()
    console.log(`📝 AI Items 数量: ${aiItems}`)

    if (aiItems > 0) {
      for (let i = 0; i < Math.min(aiItems, 11); i++) {
        const text = await page.locator('.ai-item').nth(i).textContent()
        console.log(`   ${i + 1}. ${text?.trim()}`)
      }
    } else {
      console.warn('⚠️  没有找到 AI Items！')

      // 获取页面 HTML 调试
      const bodyHTML = await page.locator('body').innerHTML()
      console.log('📄 Body HTML (前 500 字符):', bodyHTML.substring(0, 500))

      // 检查 app-container
      const appContainer = await page.locator('.app-container').count()
      console.log('✅ AppContainer:', appContainer > 0 ? '存在' : '不存在')

      if (appContainer > 0) {
        const appHTML = await page.locator('.app-container').innerHTML()
        console.log('📄 AppContainer HTML (前 1000 字符):', appHTML.substring(0, 1000))
      }
    }

    // 截图
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true })
    console.log('📸 截图已保存到 debug-screenshot.png')

    console.log('⏸️  保持浏览器打开 10 秒以便观察...')
    await page.waitForTimeout(10000)

  } catch (error) {
    console.error('❌ 调试出错:', error)
  } finally {
    await browser.close()
  }
}

debugApp().catch(console.error)
