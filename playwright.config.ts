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
  testDir: './tests/e2e/specs',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 1,
  reporter: [['html'], ['list']],
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
        // Electron-specific settings
      }
    }
  ],

  // Run your local dev server before starting the tests
  webServer: undefined // For Electron, we launch the app directly
})
