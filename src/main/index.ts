import { app, ipcMain, protocol, nativeTheme } from 'electron'
import { createMainWindow, closeAllWindows, createIndependentWindow, registerWindowIpcHandlers } from './window'
import { readOnlineConfig } from './config'
import { IPC_CHANNELS } from '../shared/constants'
import { join } from 'path'
import { readFile } from 'fs/promises'

let mainWindow: ReturnType<typeof createMainWindow> | null = null

/**
 * Register custom protocol for online resources
 * This allows the renderer process to access files in the online directory
 */
function registerOnlineProtocol() {
  protocol.handle('online', async (request) => {
    try {
      // Extract the path from the URL (e.g., 'online://openai_chatgpt/logo.png' -> 'openai_chatgpt/logo.png')
      const urlPath = request.url.substring('online://'.length)

      // Determine the base path for online files
      const basePath = app.isPackaged ? join(process.resourcesPath, 'online') : join(process.cwd(), 'online')
      const filePath = join(basePath, urlPath)

      // Read the file
      const data = await readFile(filePath)

      // Determine MIME type
      let mimeType = 'application/octet-stream'
      if (urlPath.endsWith('.png')) {
        mimeType = 'image/png'
      } else if (urlPath.endsWith('.jpg') || urlPath.endsWith('.jpeg')) {
        mimeType = 'image/jpeg'
      } else if (urlPath.endsWith('.svg')) {
        mimeType = 'image/svg+xml'
      } else if (urlPath.endsWith('.js')) {
        mimeType = 'application/javascript'
      } else if (urlPath.endsWith('.json')) {
        mimeType = 'application/json'
      }

      return new Response(data, {
        headers: {
          'Content-Type': mimeType,
          'Access-Control-Allow-Origin': '*'
        }
      })
    } catch (error) {
      console.error('Error serving online file:', error)
      return new Response('File not found', { status: 404 })
    }
  })
}

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
    createIndependentWindow(tabData, bounds)
  })

  // Handler for closing all independent windows
  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE_ALL, () => {
    closeAllWindows()
  })

  // Handler for getting system theme
  ipcMain.handle(IPC_CHANNELS.THEME_GET_SYSTEM, () => {
    // 返回实际的系统主题：'light' 或 'dark'
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  })

  // 注册窗口管理 IPC handlers
  registerWindowIpcHandlers()
}

app.whenReady().then(() => {
  // Register custom protocol before creating windows
  registerOnlineProtocol()
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
