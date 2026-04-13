import { app, ipcMain, protocol, nativeTheme, dialog, BrowserWindow } from 'electron'
import { createMainWindow, closeAllWindows, createIndependentWindow, registerWindowIpcHandlers } from './window'
import { readOnlineConfig } from './config'
import { IPC_CHANNELS } from '../shared/constants'
import { join, resolve, relative } from 'path'
import { readFile } from 'fs/promises'
import { extname } from 'path'

let mainWindow: ReturnType<typeof createMainWindow> | null = null

function configureUserDataPath() {
  const userDataDir = process.env.ONECHAT_USER_DATA_DIR
  if (!userDataDir) {
    return
  }

  const resolvedUserDataDir = resolve(userDataDir)
  app.setPath('userData', resolvedUserDataDir)
  console.log(`[OneChat] Using custom userData path: ${resolvedUserDataDir}`)
}

configureUserDataPath()

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

  ipcMain.handle(IPC_CHANNELS.ONLINE_READ_SCRIPT, async (_event, scriptPath: string) => {
    if (typeof scriptPath !== 'string' || !scriptPath.endsWith('.js')) {
      console.warn('[OnlineScript] Invalid script path:', scriptPath)
      return null
    }

    try {
      const basePath = app.isPackaged ? join(process.resourcesPath, 'online') : join(process.cwd(), 'online')
      const resolvedBase = resolve(basePath)
      const resolvedScript = resolve(resolvedBase, scriptPath)
      const relativePath = relative(resolvedBase, resolvedScript)

      if (relativePath.startsWith('..') || relativePath.includes(':')) {
        console.warn('[OnlineScript] Refused script outside online directory:', scriptPath)
        return null
      }

      return await readFile(resolvedScript, 'utf-8')
    } catch (error) {
      console.warn('[OnlineScript] Failed to read script:', scriptPath, error)
      return null
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

  // Handler for opening image file dialog
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_IMAGE, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      title: 'Select Image',
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    try {
      const filePath = result.filePaths[0]
      const data = await readFile(filePath)
      const base64 = data.toString('base64')
      const ext = extname(filePath).toLowerCase()

      // Map extension to MIME type
      const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml'
      }

      return {
        data: base64,
        name: filePath.split(/[/\\]/).pop() || 'image',
        type: mimeTypes[ext] || 'image/png'
      }
    } catch (error) {
      console.error('Error reading image file:', error)
      return null
    }
  })

  // Handler for opening any file dialog
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_FILE, async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      title: 'Select File',
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    try {
      const filePath = result.filePaths[0]
      const data = await readFile(filePath)
      const base64 = data.toString('base64')
      const ext = extname(filePath).toLowerCase()

      // Basic MIME type mapping
      const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.json': 'application/json',
        '.js': 'text/javascript',
        '.ts': 'text/typescript',
        '.html': 'text/html',
        '.css': 'text/css',
        '.md': 'text/markdown',
        '.xml': 'application/xml',
        '.zip': 'application/zip',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }

      return {
        data: base64,
        name: filePath.split(/[/\\]/).pop() || 'file',
        type: mimeTypes[ext] || 'application/octet-stream'
      }
    } catch (error) {
      console.error('Error reading file:', error)
      return null
    }
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
