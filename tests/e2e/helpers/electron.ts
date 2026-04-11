import { _electron as electron, ElectronApplication, Page } from '@playwright/test'

/**
 * Launch the Electron application for E2E testing
 * This function requires the app to be built first
 */
export async function launchElectronApp() {
  // Determine the path to the built Electron app
  // In development, we use the main process entry point
  // In production, we use the built executable

  // 清除 ELECTRON_RUN_AS_NODE 环境变量，避免 Electron 以 Node.js 模式运行
  delete process.env.ELECTRON_RUN_AS_NODE

  const isDev = process.env.NODE_ENV !== 'production'

  let electronApp: ElectronApplication

  if (isDev) {
    // Development mode: Launch from source
    // We need to build first or use electron-vite dev mode
    console.log('[E2E] Launching Electron in development mode...')

    // For development E2E tests, we need to start the app
    // This requires the app to be built or running in dev mode
    electronApp = await electron.launch({
      executablePath: require('electron'),
      args: [require('path').join(__dirname, '../../../out/main/index.js')],
      timeout: 30000
    })
  } else {
    // Production mode: Use the built app
    const execPath = process.platform === 'win32'
      ? require('path').join(__dirname, '../../../dist/OneChat.exe')
      : require('path').join(__dirname, '../../../dist/OneChat.app/Contents/MacOS/OneChat')

    electronApp = await electron.launch({
      executablePath: execPath,
      timeout: 30000
    })
  }

  return electronApp
}

/**
 * Wait for the main window to be ready
 */
export async function getMainWindow(electronApp: ElectronApplication): Promise<Page> {
  await electronApp.firstWindow({ timeout: 15000 })
  const windows = electronApp.windows()

  if (windows.length === 0) {
    throw new Error('No windows found')
  }

  return windows[0]
}

/**
 * Setup E2E test environment
 */
export async function setupE2E() {
  console.log('[E2E] Setting up E2E test environment...')

  // Build the app if needed
  if (!process.env.E2E_SKIP_BUILD) {
    console.log('[E2E] Building app for testing...')
    const { execSync } = require('child_process')
    try {
      execSync('npm run build', { stdio: 'inherit' })
    } catch (error) {
      console.error('[E2E] Build failed, attempting to run tests anyway...')
    }
  }

  const electronApp = await launchElectronApp()
  const mainWindow = await getMainWindow(electronApp)

  return { electronApp, mainWindow }
}

/**
 * Teardown E2E test environment
 */
export async function teardownE2E(electronApp: ElectronApplication) {
  await electronApp.close()
}
