import { BrowserWindow, screen, ipcMain } from 'electron'
import { join } from 'path'
import { IPC_CHANNELS } from '../shared/constants'

let independentWindows: Array<{ window: BrowserWindow; tabData: any }> = []

export function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    frame: true,
    autoHideMenuBar: true,
    resizable: true,
    backgroundColor: '#1e1e1e',
    webPreferences: {
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js')
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

export function createIndependentWindow(tabData: any, bounds?: { x: number; y: number; width: number; height: number }) {
  const win = new BrowserWindow({
    x: bounds?.x,
    y: bounds?.y,
    width: bounds?.width || 800,
    height: bounds?.height || 600,
    minWidth: 600,
    minHeight: 400,
    frame: true,
    resizable: true,
    webPreferences: {
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js')
    }
  })

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173?type=independent')
    win.webContents.openDevTools()
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), {
      search: '?type=independent'
    })
  }

  // 传递标签数据
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('window:init-tab', tabData)
  })

  win.on('closed', () => {
    independentWindows = independentWindows.filter(w => w.window !== win)
  })

  const windowInfo = { window: win, tabData }
  independentWindows.push(windowInfo)
  return win
}

export function closeAllWindows() {
  independentWindows.forEach(w => w.window.close())
  independentWindows = []
}

export function getAllIndependentWindows() {
  return independentWindows.map(w => w.window)
}

// 新增：获取窗口信息
export function getWindowInfo(windowId: number) {
  return independentWindows.find(w => w.window.id === windowId)
}

// 新增：合并标签到主窗口
export function mergeTabToMainWindow(tabData: any, sourceWindowId: number) {
  const sourceWindowInfo = independentWindows.find(w => w.window.id === sourceWindowId)

  if (!sourceWindowInfo) {
    console.error('[WindowManager] Source window not found')
    return false
  }

  // 从源窗口移除标签数据
  sourceWindowInfo.tabData = null

  // 如果源窗口没有标签了，关闭它
  if (!sourceWindowInfo.tabData) {
    sourceWindowInfo.window.close()
    independentWindows = independentWindows.filter(w => w.window.id !== sourceWindowId)
  }

  return true
}

// 注册窗口管理 IPC handlers
export function registerWindowIpcHandlers() {
  // 合并标签到主窗口
  ipcMain.handle(IPC_CHANNELS.WINDOW_MERGE_TO_MAIN, async (_event, { tabData, sourceWindowId }) => {
    return mergeTabToMainWindow(tabData, sourceWindowId)
  })

  // 获取所有独立窗口
  ipcMain.handle(IPC_CHANNELS.WINDOW_GET_ALL, () => {
    return independentWindows.map(w => ({
      id: w.window.id,
      hasTab: !!w.tabData
    }))
  })
}
