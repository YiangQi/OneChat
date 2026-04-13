export const IPC_CHANNELS = {
  // 渲染进程 → 主进程
  CONFIG_READ_ONLINE_JSON: 'config:read-online-json',
  ONLINE_READ_SCRIPT: 'online:read-script',
  WEBVIEW_PRELOAD_GET_PATH: 'webview-preload:get-path',
  WINDOW_CREATE_INDEPENDENT: 'window:create-independent',
  WINDOW_CLOSE_ALL: 'window:close-all',
  THEME_GET_SYSTEM: 'theme:get-system',

  // 新增：窗口合并相关
  WINDOW_MERGE_TO_MAIN: 'window:merge-to-main',
  WINDOW_MOVE_TAB: 'window:move-tab-between-windows',
  WINDOW_GET_ALL: 'window:get-all-windows',

  // 文件选择对话框
  DIALOG_OPEN_IMAGE: 'dialog:open-image',
  DIALOG_OPEN_FILE: 'dialog:open-file',

  // 主进程 → 渲染进程
  THEME_SYSTEM_CHANGED: 'theme:system-changed',
  WINDOW_TAB_DROPPED: 'window:tab-dropped'
} as const

export const THEME = {
  AUTO: 'auto',
  DARK: 'dark',
  LIGHT: 'light'
} as const

export const WINDOW_CONFIG = {
  MAIN: {
    MIN_WIDTH: 1200,
    MIN_HEIGHT: 800,
    WIDTH: 1400,
    HEIGHT: 900
  },
  INDEPENDENT: {
    MIN_WIDTH: 600,
    MIN_HEIGHT: 400
  }
} as const
