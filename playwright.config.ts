import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 1,
  reporter: 'html',
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
})
