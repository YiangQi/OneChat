import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/constants'
import type { OnlineConfigResult } from '../shared/types'

/**
 * Exposes protected methods that allow the renderer process to use
 * the ipcRenderer without exposing the entire object
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Reads the online AI models configuration
   * @returns Promise<OnlineConfigResult> Object containing models array and online directory path
   */
  readOnlineConfig: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_READ_ONLINE_JSON),

  /**
   * Creates a new independent window
   * @param tabData - The tab data to initialize the window with
   * @param bounds - Optional window bounds (x, y, width, height)
   */
  createIndependentWindow: (tabData: any, bounds?: { x: number; y: number; width: number; height: number }) =>
    ipcRenderer.send(IPC_CHANNELS.WINDOW_CREATE_INDEPENDENT, { tabData, bounds }),

  /**
   * Closes all independent windows
   */
  closeAllWindows: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE_ALL),

  /**
   * Gets the system theme preference
   * @returns Promise<string> The system theme ('auto', 'dark', or 'light')
   */
  getSystemTheme: () => ipcRenderer.invoke(IPC_CHANNELS.THEME_GET_SYSTEM),

  /**
   * Listens for theme system changes
   * @param callback - Callback function to handle theme changes
   */
  onThemeSystemChanged: (callback: (theme: string) => void) => {
    ipcRenderer.on(IPC_CHANNELS.THEME_SYSTEM_CHANGED, (_event, theme) => callback(theme))
  },

  /**
   * Listens for tab drop events
   * @param callback - Callback function to handle tab drops
   */
  onTabDropped: (callback: (data: any) => void) => {
    ipcRenderer.on(IPC_CHANNELS.WINDOW_TAB_DROPPED, (_event, data) => callback(data))
  },

  /**
   * Merges a tab to the main window
   * @param tabData - The tab data to merge
   * @param sourceWindowId - The ID of the source window
   */
  mergeToMainWindow: (tabData: any, sourceWindowId: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MERGE_TO_MAIN, { tabData, sourceWindowId }),

  /**
   * Gets all independent windows
   * @returns Promise<Array> Array of window info objects
   */
  getAllWindows: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_GET_ALL)
})

/**
 * Type declarations for the exposed API
 */
declare global {
  interface Window {
    electronAPI: {
      readOnlineConfig: () => Promise<OnlineConfigResult>
      createIndependentWindow: (tabData: any, bounds?: { x: number; y: number; width: number; height: number }) => void
      closeAllWindows: () => void
      getSystemTheme: () => Promise<string>
      onThemeSystemChanged: (callback: (theme: string) => void) => void
      onTabDropped: (callback: (data: any) => void) => void
      mergeToMainWindow: (tabData: any, sourceWindowId: number) => Promise<boolean>
      getAllWindows: () => Promise<Array<{ id: number; hasTab: boolean }>>
    }
  }
}
