import { BrowserWindow, screen } from 'electron'
import { join } from 'path'

let independentWindows: BrowserWindow[] = []

export function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
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
    independentWindows = independentWindows.filter(w => w !== win)
  })

  independentWindows.push(win)
  return win
}

export function closeAllWindows() {
  independentWindows.forEach(win => win.close())
  independentWindows = []
}

export function getAllIndependentWindows() {
  return independentWindows
}
