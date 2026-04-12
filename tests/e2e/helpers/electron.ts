import { _electron as electron, ElectronApplication, Page } from '@playwright/test'
import { execSync } from 'child_process'
import path from 'path'

function createElectronEnv() {
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  return env
}

/**
 * Launch the Electron application for E2E testing.
 * This helper always clears ELECTRON_RUN_AS_NODE so Electron boots in app mode.
 */
export async function launchElectronApp() {
  const launchEnv = createElectronEnv()
  const isDev = process.env.NODE_ENV !== 'production'

  if (isDev) {
    console.log('[E2E] Launching Electron in development mode...')
    return electron.launch({
      executablePath: require('electron'),
      args: [path.join(__dirname, '../../../out/main/index.js')],
      env: launchEnv,
      timeout: 30000
    })
  }

  const execPath = process.platform === 'win32'
    ? path.join(__dirname, '../../../dist/OneChat.exe')
    : path.join(__dirname, '../../../dist/OneChat.app/Contents/MacOS/OneChat')

  return electron.launch({
    executablePath: execPath,
    env: launchEnv,
    timeout: 30000
  })
}

export async function getMainWindow(electronApp: ElectronApplication): Promise<Page> {
  await electronApp.firstWindow({ timeout: 15000 })
  const windows = electronApp.windows()

  if (windows.length === 0) {
    throw new Error('No windows found')
  }

  const mainWindow = windows[0]

  mainWindow.on('console', msg => {
    const type = msg.type()
    const text = msg.text()

    if (type === 'error') {
      console.error(`[Renderer Console ERROR] ${text}`)
    } else if (type === 'warning') {
      console.warn(`[Renderer Console WARN] ${text}`)
    } else if (type === 'log') {
      console.log(`[Renderer Console LOG] ${text}`)
    } else {
      console.log(`[Renderer Console ${type}] ${text}`)
    }
  })

  mainWindow.on('pageerror', error => {
    console.error('[Renderer Page Error]', error)
  })

  return mainWindow
}

export async function setupE2E() {
  console.log('[E2E] Setting up E2E test environment...')

  if (!process.env.E2E_SKIP_BUILD) {
    console.log('[E2E] Building app for testing...')
    try {
      const buildCommand = process.platform === 'win32' ? 'npm.cmd run build' : 'npm run build'
      execSync(buildCommand, { stdio: 'inherit', env: createElectronEnv() })
    } catch (error) {
      console.error('[E2E] Build failed, attempting to run tests anyway...', error)
    }
  }

  const electronApp = await launchElectronApp()
  const mainWindow = await getMainWindow(electronApp)

  return { electronApp, mainWindow }
}

export async function teardownE2E(electronApp: ElectronApplication) {
  await electronApp.close()
}
