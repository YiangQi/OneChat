import { app } from 'electron'
import { createMainWindow, closeAllWindows } from './window'

let mainWindow: ReturnType<typeof createMainWindow> | null = null

app.whenReady().then(() => {
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
