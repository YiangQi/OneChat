import { app, ipcMain, protocol, nativeTheme, dialog, BrowserWindow } from 'electron'
import { createMainWindow, closeAllWindows, createIndependentWindow, registerWindowIpcHandlers } from './window'
import { getOnlineDirectoryPath, readOnlineConfig } from './config'
import { IPC_CHANNELS } from '../shared/constants'
import { join, resolve, relative } from 'path'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { extname } from 'path'

let mainWindow: ReturnType<typeof createMainWindow> | null = null
const COMMON_INJECT_SCRIPT = 'common_inject.js'

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

      const filePath = join(getOnlineDirectoryPath(), urlPath)

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

function getOnlineBasePath() {
  return getOnlineDirectoryPath()
}

function resolveOnlineScriptPath(scriptPath: string) {
  if (typeof scriptPath !== 'string' || !scriptPath.endsWith('.js')) {
    console.warn('[OnlineScript] Invalid script path:', scriptPath)
    return null
  }

  const resolvedBase = resolve(getOnlineBasePath())
  const resolvedScript = resolve(resolvedBase, scriptPath)
  const relativePath = relative(resolvedBase, resolvedScript)

  if (relativePath.startsWith('..') || relativePath.includes(':')) {
    console.warn('[OnlineScript] Refused script outside online directory:', scriptPath)
    return null
  }

  return resolvedScript
}

function createCallBridgeBootstrapSource() {
  return `
(() => {
  const stateKey = "__ONECHAT_INJECTION__";
  const state = window[stateKey] || (window[stateKey] = {
    bridgeReady: false,
    providerInjected: false,
    commonInjected: false,
    loadEndedDispatched: false,
    lastUrlChanged: "",
    invokeEvents: []
  });

  if (state.bridgeReady && window.CallBridge) return;

  const listeners = Object.create(null);
  window.CallBridge = {
    addEventListener(name, handler) {
      if (typeof name !== "string" || typeof handler !== "function") return false;
      const bucket = listeners[name] || (listeners[name] = []);
      if (!bucket.includes(handler)) bucket.push(handler);
      return true;
    },
    dispatchEvent(name, ...args) {
      const bucket = listeners[name];
      if (!bucket || bucket.length === 0) return 0;
      let handled = 0;
      for (const handler of [...bucket]) {
        try {
          handler(...args);
          handled += 1;
        } catch (error) {
          console.error("[OneChat CallBridge] listener failed", name, error);
        }
      }
      return handled;
    },
    invoke(name, ...args) {
      state.invokeEvents.push({ name, args, timestamp: Date.now() });
      if (state.invokeEvents.length > 100) state.invokeEvents.shift();
      return true;
    },
    getInvokedEvents() {
      return state.invokeEvents.slice();
    },
    clearInvokedEvents() {
      const events = state.invokeEvents.slice();
      state.invokeEvents.length = 0;
      return events;
    }
  };
  state.bridgeReady = true;
})();
`
}

async function createWebviewPreload(scriptPath: string | undefined) {
  const commonPath = resolveOnlineScriptPath(COMMON_INJECT_SCRIPT)
  const providerPath = scriptPath ? resolveOnlineScriptPath(scriptPath) : null
  if (!commonPath) return ''

  const providerSource = providerPath ? await readFile(providerPath, 'utf-8') : ''
  const commonSource = await readFile(commonPath, 'utf-8')
  const pageWorldSource = [
    createCallBridgeBootstrapSource(),
    providerSource,
    commonSource,
    `
(() => {
  const state = window.__ONECHAT_INJECTION__ || (window.__ONECHAT_INJECTION__ = {});
  state.providerInjected = ${providerPath ? 'true' : 'false'};
  state.providerScript = ${JSON.stringify(scriptPath || '')};
  state.commonInjected = true;
  state.commonScript = ${JSON.stringify(COMMON_INJECT_SCRIPT)};
})();
`
  ].join('\n;\n')
  const preloadSource = [
    "const { webFrame } = require('electron')",
    `webFrame.executeJavaScript(${JSON.stringify(pageWorldSource)})`
  ].join('\n')

  const outputDir = join(app.getPath('userData'), 'webview-preloads')
  await mkdir(outputDir, { recursive: true })
  const safeName = (scriptPath || 'common').replace(/[^a-z0-9_.-]+/gi, '_')
  const outputPath = join(outputDir, `${safeName}.js`)
  await writeFile(outputPath, preloadSource, 'utf-8')
  return outputPath
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
      const resolvedScript = resolveOnlineScriptPath(scriptPath)
      if (!resolvedScript) return null

      return await readFile(resolvedScript, 'utf-8')
    } catch (error) {
      console.warn('[OnlineScript] Failed to read script:', scriptPath, error)
      return null
    }
  })

  ipcMain.handle(IPC_CHANNELS.WEBVIEW_PRELOAD_GET_PATH, async (_event, scriptPath?: string) => {
    try {
      return await createWebviewPreload(scriptPath)
    } catch (error) {
      console.warn('[WebViewPreload] Failed to create preload:', scriptPath, error)
      return ''
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
