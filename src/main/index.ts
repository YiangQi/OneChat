import { app, ipcMain } from 'electron'
import { createMainWindow, closeAllWindows } from './window'
import { readOnlineConfig } from './config'
import { IPC_CHANNELS } from '../shared/constants'

let mainWindow: ReturnType<typeof createMainWindow> | null = null

/**
 * Register IPC handlers for communication with renderer process
 */
function registerIpcHandlers() {
  // Handler for reading online AI models configuration
  ipcMain.handle(IPC_CHANNELS.CONFIG_READ_ONLINE_JSON, async () => {
    try {
      return await readOnlineConfig()
    } catch (error) {
      console.error('Error reading online config:', error)
      // Return empty config on error
      return {
        models: [],
        onlineDir: ''
      }
    }
  })

  // Handler for creating independent windows
  ipcMain.on(IPC_CHANNELS.WINDOW_CREATE_INDEPENDENT, (_event, { tabData, bounds }) => {
    const { createIndependentWindow } = require('./window')
    createIndependentWindow(tabData, bounds)
  })

  // Handler for closing all independent windows
  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE_ALL, () => {
    closeAllWindows()
  })

  // Handler for getting system theme
  ipcMain.handle(IPC_CHANNELS.THEME_GET_SYSTEM, () => {
    // TODO: Implement system theme detection
    return 'auto'
  })
}

app.whenReady().then(() => {
  registerIpcHandlers()
  mainWindow = createMainWindow()

  app.on('activate', () => {
    if (mainWindow === null || mainWindow.isDestroyed()) {
      mainWindow = createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  closeAllWindows()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
