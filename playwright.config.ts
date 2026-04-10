import { defineConfig } from '@playwright/test'

/**
 * Playwright Configuration for Electron E2E Testing
 *
 * For Electron E2E tests:
 * 1. Build the app first: npm run build
 * 2. Run E2E tests: npm run test:e2e
 *
 * Or skip build and test against existing build:
 * E2E_SKIP_BUILD=1 npm run test:e2e
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // 多窗口测试需要串行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 串行执行
  reporter: 'html',
  timeout: 60000, // 60 seconds timeout for Electron app startup

  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000
  },

  projects: [
    {
      name: 'electron',
      use: {
        // Electron 特定配置
      },
    },
  ],

  // 测试本地开发服务器
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  // },
})
