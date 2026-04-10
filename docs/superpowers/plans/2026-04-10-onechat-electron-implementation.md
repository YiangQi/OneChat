# OneChat Electron 版本实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个 VSCode 风格的 Electron 客户端，支持同时与多个 AI 网站对话，具有标签页、分栏和独立窗口功能

**Architecture:** 主进程负责窗口管理和系统交互，渲染进程运行 Vue3 应用，使用 Golden Layout 管理分栏布局，webview 标签加载 AI 网站，Pinia 管理应用状态

**Tech Stack:** Electron, Vue3, TypeScript, Element Plus, Pinia, Golden Layout, webview

---

## 文件结构

在定义任务之前，先规划项目的文件结构：

```
onechat/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── electron.vite.config.ts
├── src/
│   ├── main/                        # 主进程代码
│   │   ├── index.ts                 # 主进程入口
│   │   ├── window.ts                # 窗口管理
│   │   ├── config.ts                # 配置读取（online.json）
│   │   └── ipc.ts                   # IPC 通信处理
│   ├── preload/                     # Preload 脚本
│   │   └── index.ts                 # Preload 入口
│   ├── renderer/                    # 渲染进程代码
│   │   ├── index.html               # HTML 模板
│   │   ├── src/
│   │   │   ├── main.ts              # Vue 应用入口
│   │   │   ├── App.vue              # 根组件
│   │   │   ├── components/          # Vue 组件
│   │   │   │   ├── ActivityBar.vue  # Activity Bar 组件
│   │   │   │   ├── Sidebar.vue      # Sidebar 容器组件
│   │   │   │   ├── AIList.vue       # AI 列表组件
│   │   │   │   ├── TabContainer.vue # 标签容器组件（核心）
│   │   │   │   ├── TabItem.vue      # 单个标签组件
│   │   │   │   ├── WebViewContainer.vue # WebView 容器组件
│   │   │   │   ├── SettingsButton.vue   # 设置按钮组件
│   │   │   │   └── SettingsDialog.vue   # 设置弹窗组件
│   │   │   ├── stores/              # Pinia 状态管理
│   │   │   │   ├── aiModels.ts      # AI 模型状态
│   │   │   │   ├── tabs.ts          # 标签页状态
│   │   │   │   ├── theme.ts         # 主题状态
│   │   │   │   └── layout.ts        # 布局状态
│   │   │   ├── types/               # TypeScript 类型定义
│   │   │   │   ├── index.ts         # 导出所有类型
│   │   │   │   ├── ai.ts            # AI 相关类型
│   │   │   │   ├── tab.ts           # 标签相关类型
│   │   │   │   └── layout.ts        # 布局相关类型
│   │   │   ├── styles/              # 样式文件
│   │   │   │   ├── main.css         # 主样式
│   │   │   │   ├── variables.css    # CSS 变量
│   │   │   │   └── dark.css         # 深色主题
│   │   │   └── utils/               # 工具函数
│   │   │       ├── logger.ts        # 日志工具
│   │   │       └── helpers.ts       # 辅助函数
│   │   └── vite-env.d.ts           # Vite 类型声明
│   └── shared/                      # 共享代码
│       ├── types/                   # 共享类型
│       └── constants.ts             # 共享常量
├── online/                          # AI 模型配置目录
│   └── online.json                  # AI 模型配置文件
└── resources/                       # 资源文件
    └── icons/                       # 图标文件
        └── default-ai.svg           # 默认 AI 图标
```

---

## 任务分解

### 阶段 1：项目初始化

#### Task 1: 初始化 Electron + Vue3 项目

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `electron.vite.config.ts`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "onechat",
  "version": "1.0.0",
  "description": "Ask once, get answers from many",
  "main": "dist/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "build:win": "npm run build && electron-builder --win"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "pinia": "^2.1.0",
    "element-plus": "^2.5.0",
    "golden-layout": "^2.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "electron": "^28.0.0",
    "electron-builder": "^24.0.0",
    "electron-vite": "^2.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vue-tsc": "^1.8.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/renderer/src", "src/preload"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "electron.vite.config.ts"]
}
```

- [ ] **Step 4: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src')
    }
  },
  server: {
    port: 5173
  }
})
```

- [ ] **Step 5: 创建 electron.vite.config.ts**

```typescript
import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts')
        }
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts')
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer/src')
      }
    },
    plugins: [vue()]
  }
})
```

- [ ] **Step 6: 安装依赖**

```bash
npm install
```

- [ ] **Step 7: 提交**

```bash
git add package.json tsconfig.json tsconfig.node.json vite.config.ts electron.vite.config.ts
git commit -m "feat: initialize Electron + Vue3 + TypeScript project"
```

---

#### Task 2: 创建基础目录结构和类型定义

**Files:**
- Create: `src/shared/types/index.ts`
- Create: `src/shared/types/ai.ts`
- Create: `src/shared/types/tab.ts`
- Create: `src/shared/types/layout.ts`
- Create: `src/shared/constants.ts`
- Create: `src/renderer/src/types/index.ts`

- [ ] **Step 1: 创建 AI 相关类型**

```typescript
// src/shared/types/ai.ts
export interface AIModel {
  id: string
  name: string
  url: string
  icon: string
  script?: string
}

export interface AIModelConfig {
  name: string
  url: string
  icon: string
  script?: string
}
```

- [ ] **Step 2: 创建标签相关类型**

```typescript
// src/shared/types/tab.ts
export interface Tab {
  id: string
  modelId: string
  model: any
  createdAt: number
  windowId?: number
}

export type TabState = 'loading' | 'loaded' | 'error'
```

- [ ] **Step 3: 创建布局相关类型**

```typescript
// src/shared/types/layout.ts
export type SplitDirection = 'horizontal' | 'vertical'

export interface LayoutConfig {
  settings: {
    showPopoutIcon: boolean
    showMaximiseIcon: boolean
    showCloseIcon: boolean
    hasHeaders: boolean
    tabControlOffset: number
    reorderEnabled: boolean
    splitMode: SplitDirection
  }
  dimensions: {
    borderWidth: number
    minimumPixelWidth: number
    minimumPixelHeight: number
    headerHeight: number
  }
}
```

- [ ] **Step 4: 创建共享类型导出**

```typescript
// src/shared/types/index.ts
export * from './ai'
export * from './tab'
export * from './layout'
```

- [ ] **Step 5: 创建共享常量**

```typescript
// src/shared/constants.ts
export const IPC_CHANNELS = {
  // 渲染进程 → 主进程
  CONFIG_READ_ONLINE_JSON: 'config:read-online-json',
  WINDOW_CREATE_INDEPENDENT: 'window:create-independent',
  WINDOW_CLOSE_ALL: 'window:close-all',
  THEME_GET_SYSTEM: 'theme:get-system',

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
```

- [ ] **Step 6: 创建渲染进程类型导出**

```typescript
// src/renderer/src/types/index.ts
// 重新导出共享类型以便在渲染进程中使用
export * from '@/shared/types'
```

- [ ] **Step 7: 提交**

```bash
git add src/shared/
git commit -m "feat: add shared types and constants"
```

---

### 阶段 2：主进程开发

#### Task 3: 创建主进程入口和窗口管理

**Files:**
- Create: `src/main/index.ts`
- Create: `src/main/window.ts`

- [ ] **Step 1: 创建主进程入口**

```typescript
// src/main/index.ts
import { app, BrowserWindow } from 'electron'
import { join } from 'path'

let mainWindow: BrowserWindow | null = null

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
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

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

- [ ] **Step 2: 创建窗口管理模块**

```typescript
// src/main/window.ts
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
```

- [ ] **Step 3: 更新主进程入口使用窗口管理模块**

```typescript
// src/main/index.ts
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
```

- [ ] **Step 4: 提交**

```bash
git add src/main/
git commit -m "feat: add main process entry and window management"
```

---

#### Task 4: 实现配置读取模块

**Files:**
- Create: `src/main/config.ts`
- Create: `online/online.json`

- [ ] **Step 1: 创建 online.json 配置文件**

```json
[
  {
    "name": "ChatGPT",
    "url": "https://chat.openai.com/",
    "icon": "openai_chatgpt/logo.png"
  },
  {
    "name": "Claude",
    "url": "https://claude.ai",
    "icon": "anthropic_claude/logo.png"
  },
  {
    "name": "DeepSeek",
    "url": "https://chat.deepseek.com",
    "icon": "deepseek_deepseek/logo.png"
  }
]
```

- [ ] **Step 2: 创建配置读取模块**

```typescript
// src/main/config.ts
import { readFile } from 'fs/promises'
import { join } from 'path'
import { app } from 'electron'
import { AIModel, AIModelConfig } from '@shared/types'

const ONLINE_CONFIG_PATH = join(app.getPath('userData'), 'online.json')

export async function readOnlineConfig(): Promise<AIModel[]> {
  try {
    const content = await readFile(ONLINE_CONFIG_PATH, 'utf-8')
    const configs: AIModelConfig[] = JSON.parse(content)

    return configs.map((config, index) => ({
      id: `model-${index}`,
      ...config
    }))
  } catch (error) {
    console.error('Failed to read online.json:', error)
    return []
  }
}

export function getOnlineConfigPath(): string {
  return ONLINE_CONFIG_PATH
}
```

- [ ] **Step 3: 提交**

```bash
git add src/main/config.ts online/online.json
git commit -m "feat: add config reading module for AI models"
```

---

#### Task 5: 实现 IPC 通信处理

**Files:**
- Create: `src/main/ipc.ts`

- [ ] **Step 1: 创建 IPC 处理模块**

```typescript
// src/main/ipc.ts
import { ipcMain, nativeTheme, BrowserWindow } from 'electron'
import { IPC_CHANNELS, THEME } from '@shared/constants'
import { readOnlineConfig } from './config'
import { createIndependentWindow } from './window'

export function setupIpcHandlers() {
  // 读取 online.json
  ipcMain.handle(IPC_CHANNELS.CONFIG_READ_ONLINE_JSON, async () => {
    return await readOnlineConfig()
  })

  // 创建独立窗口
  ipcMain.handle(IPC_CHANNELS.WINDOW_CREATE_INDEPENDENT, async (event, { tabData, bounds }) => {
    const win = createIndependentWindow(tabData, bounds)
    return { success: true, windowId: win.id }
  })

  // 关闭所有窗口
  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE_ALL, () => {
    const windows = BrowserWindow.getAllWindows()
    windows.forEach(win => {
      if (win.id > 1) { // 保留主窗口
        win.close()
      }
    })
    return { success: true }
  })

  // 获取系统主题
  ipcMain.handle(IPC_CHANNELS.THEME_GET_SYSTEM, () => {
    return nativeTheme.shouldUseDarkColors ? THEME.DARK : THEME.LIGHT
  })

  // 监听系统主题变化
  nativeTheme.on('updated', () => {
    const theme = nativeTheme.shouldUseDarkColors ? THEME.DARK : THEME.LIGHT
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send(IPC_CHANNELS.THEME_SYSTEM_CHANGED, theme)
    })
  })
}
```

- [ ] **Step 2: 在主进程入口中注册 IPC 处理器**

```typescript
// src/main/index.ts (更新)
import { app } from 'electron'
import { createMainWindow, closeAllWindows } from './window'
import { setupIpcHandlers } from './ipc'

let mainWindow: ReturnType<typeof createMainWindow> | null = null

app.whenReady().then(() => {
  setupIpcHandlers()
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
```

- [ ] **Step 3: 提交**

```bash
git add src/main/ipc.ts src/main/index.ts
git commit -m "feat: add IPC communication handlers"
```

---

#### Task 6: 创建 Preload 脚本

**Files:**
- Create: `src/preload/index.ts`

- [ ] **Step 1: 创建 preload 脚本**

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '@shared/constants'

const electronAPI = {
  // AI 模型配置
  readOnlineConfig: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_READ_ONLINE_JSON),

  // 窗口操作
  createIndependentWindow: (tabData: any, bounds?: any) =>
    ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CREATE_INDEPENDENT, { tabData, bounds }),

  closeAllWindows: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE_ALL),

  // 主题
  getSystemTheme: () => ipcRenderer.invoke(IPC_CHANNELS.THEME_GET_SYSTEM),

  onSystemThemeChanged: (callback: (theme: string) => void) => {
    const listener = (_event: any, theme: string) => callback(theme)
    ipcRenderer.on(IPC_CHANNELS.THEME_SYSTEM_CHANGED, listener)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.THEME_SYSTEM_CHANGED, listener)
  },

  // 独立窗口初始化
  onInitTab: (callback: (tabData: any) => void) => {
    const listener = (_event: any, tabData: any) => callback(tabData)
    ipcRenderer.on('window:init-tab', listener)
    return () => ipcRenderer.removeListener('window:init-tab', listener)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
```

- [ ] **Step 2: 创建 Electron API 类型声明**

```typescript
// src/renderer/vite-env.d.ts (更新)
interface Window {
  electronAPI: {
    readOnlineConfig: () => Promise<any[]>
    createIndependentWindow: (tabData: any, bounds?: any) => Promise<{ success: boolean; windowId: number }>
    closeAllWindows: () => Promise<{ success: boolean }>
    getSystemTheme: () => Promise<string>
    onSystemThemeChanged: (callback: (theme: string) => void) => () => void
    onInitTab: (callback: (tabData: any) => void) => () => void
  }
}
```

- [ ] **Step 3: 提交**

```bash
git add src/preload/ src/renderer/vite-env.d.ts
git commit -m "feat: add preload script with context bridge"
```

---

### 阶段 3：渲染进程基础

#### Task 7: 创建渲染进程入口和根组件

**Files:**
- Create: `src/renderer/index.html`
- Create: `src/renderer/src/main.ts`
- Create: `src/renderer/src/App.vue`

- [ ] **Step 1: 创建 HTML 模板**

```html
<!-- src/renderer/index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OneChat</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 2: 创建 Vue 应用入口**

```typescript
// src/renderer/src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(ElementPlus)

app.mount('#app')
```

- [ ] **Step 3: 创建根组件**

```vue
<!-- src/renderer/src/App.vue -->
<template>
  <div class="app-container" :class="themeClass">
    <ActivityBar />
    <Sidebar />
    <TabContainer />
    <SettingsButton />
    <SettingsDialog v-model="settingsVisible" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import ActivityBar from '@/components/ActivityBar.vue'
import Sidebar from '@/components/Sidebar.vue'
import TabContainer from '@/components/TabContainer.vue'
import SettingsButton from '@/components/SettingsButton.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'

const themeStore = useThemeStore()
const settingsVisible = computed({
  get: () => themeStore.settingsVisible,
  set: (val) => themeStore.setSettingsVisible(val)
})

const themeClass = computed(() => ({
  'theme-dark': themeStore.currentTheme === 'dark',
  'theme-light': themeStore.currentTheme === 'light'
}))

onMounted(() => {
  themeStore.syncSystemTheme()
})
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
</style>
```

- [ ] **Step 4: 提交**

```bash
git add src/renderer/index.html src/renderer/src/main.ts src/renderer/src/App.vue
git commit -m "feat: add renderer entry and root component"
```

---

#### Task 8: 创建样式文件

**Files:**
- Create: `src/renderer/src/styles/main.css`
- Create: `src/renderer/src/styles/variables.css`
- Create: `src/renderer/src/styles/dark.css`

- [ ] **Step 1: 创建主样式文件**

```css
/* src/renderer/src/styles/main.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}

/* 深色主题 */
.theme-dark {
  --bg-primary: #1e1e1e;
  --bg-secondary: #252526;
  --bg-tertiary: #2d2d30;
  --text-primary: #d4d4d4;
  --text-secondary: #858585;
  --border-color: #3c3c3c;
  --accent-color: #007acc;
  --hover-color: #3c3c3c;
}

/* 浅色主题 */
.theme-light {
  --bg-primary: #ffffff;
  --bg-secondary: #f3f3f3;
  --bg-tertiary: #e8e8e8;
  --text-primary: #333333;
  --text-secondary: #666666;
  --border-color: #e0e0e0;
  --accent-color: #007acc;
  --hover-color: #f0f0f0;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
}
```

- [ ] **Step 2: 提交**

```bash
git add src/renderer/src/styles/
git commit -m "feat: add CSS styles for light and dark themes"
```

---

### 阶段 4：状态管理

#### Task 9: 创建主题 Store

**Files:**
- Create: `src/renderer/src/stores/theme.ts`

- [ ] **Step 1: 创建主题 Store**

```typescript
// src/renderer/src/stores/theme.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { THEME } from '@shared/constants'

type ThemeValue = typeof THEME[keyof typeof THEME]

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeValue>(THEME.AUTO)
  const systemTheme = ref<'light' | 'dark'>('light')
  const settingsVisible = ref(false)

  const currentTheme = computed(() => {
    if (theme.value === THEME.AUTO) {
      return systemTheme.value
    }
    return theme.value
  })

  async function syncSystemTheme() {
    const sysTheme = await window.electronAPI.getSystemTheme()
    systemTheme.value = sysTheme as 'light' | 'dark'
  }

  function setTheme(newTheme: ThemeValue) {
    theme.value = newTheme
  }

  function setSettingsVisible(visible: boolean) {
    settingsVisible.value = visible
  }

  // 监听系统主题变化
  function initThemeListener() {
    window.electronAPI.onSystemThemeChanged((sysTheme) => {
      systemTheme.value = sysTheme as 'light' | 'dark'
    })
  }

  return {
    theme,
    systemTheme,
    settingsVisible,
    currentTheme,
    syncSystemTheme,
    setTheme,
    setSettingsVisible,
    initThemeListener
  }
})
```

- [ ] **Step 2: 提交**

```bash
git add src/renderer/src/stores/theme.ts
git commit -m "feat: add theme store with auto/light/dark support"
```

---

#### Task 10: 创建 AI 模型 Store

**Files:**
- Create: `src/renderer/src/stores/aiModels.ts`

- [ ] **Step 1: 创建 AI 模型 Store**

```typescript
// src/renderer/src/stores/aiModels.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AIModel } from '@shared/types'

export const useAIModelsStore = defineStore('aiModels', () => {
  const models = ref<AIModel[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadModels() {
    loading.value = true
    error.value = null

    try {
      const data = await window.electronAPI.readOnlineConfig()
      models.value = data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load AI models'
      console.error('Failed to load AI models:', err)
    } finally {
      loading.value = false
    }
  }

  function getModelById(id: string) {
    return models.value.find(m => m.id === id)
  }

  return {
    models,
    loading,
    error,
    loadModels,
    getModelById
  }
})
```

- [ ] **Step 2: 提交**

```bash
git add src/renderer/src/stores/aiModels.ts
git commit -m "feat: add AI models store"
```

---

#### Task 11: 创建标签页 Store

**Files:**
- Create: `src/renderer/src/stores/tabs.ts`

- [ ] **Step 1: 创建标签页 Store**

```typescript
// src/renderer/src/stores/tabs.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Tab } from '@shared/types'
import type { AIModel } from '@shared/types'

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<Tab[]>([])
  const activeTabId = ref<string | null>(null)
  const isFirstOpen = ref(true)

  const activeTab = computed(() => {
    return tabs.value.find(t => t.id === activeTabId.value) || null
  })

  function generateTabId(): string {
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  function openTab(model: AIModel) {
    // 检查是否已存在相同模型的标签
    const existingTab = tabs.value.find(t => t.modelId === model.id)

    if (existingTab) {
      // 切换到现有标签
      activeTabId.value = existingTab.id
      return existingTab
    }

    // 创建新标签
    const newTab: Tab = {
      id: generateTabId(),
      modelId: model.id,
      model: model,
      createdAt: Date.now()
    }

    tabs.value.push(newTab)
    activeTabId.value = newTab.id

    return newTab
  }

  function closeTab(tabId: string) {
    const index = tabs.value.findIndex(t => t.id === tabId)
    if (index === -1) return

    tabs.value.splice(index, 1)

    // 如果关闭的是当前激活的标签，激活另一个标签
    if (activeTabId.value === tabId) {
      if (tabs.value.length > 0) {
        activeTabId.value = tabs.value[Math.max(0, index - 1)].id
      } else {
        activeTabId.value = null
        isFirstOpen.value = true
      }
    }
  }

  function activateTab(tabId: string) {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      activeTabId.value = tabId
    }
  }

  return {
    tabs,
    activeTabId,
    activeTab,
    isFirstOpen,
    openTab,
    closeTab,
    activateTab
  }
})
```

- [ ] **Step 2: 提交**

```bash
git add src/renderer/src/stores/tabs.ts
git commit -m "feat: add tabs store with unique model constraint"
```

---

#### Task 12: 创建布局 Store

**Files:**
- Create: `src/renderer/src/stores/layout.ts`

- [ ] **Step 1: 创建布局 Store**

```typescript
// src/renderer/src/stores/layout.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  const goldenLayout = ref<any>(null)
  const isInitialized = ref(false)

  function initLayout(layoutInstance: any) {
    goldenLayout.value = layoutInstance
    isInitialized.value = true
  }

  function createComponent(model: any) {
    if (!goldenLayout.value) {
      console.error('Golden Layout not initialized')
      return
    }

    // 创建新组件的逻辑将由 TabContainer 组件处理
    // 这里只是存储布局实例的引用
  }

  return {
    goldenLayout,
    isInitialized,
    initLayout,
    createComponent
  }
})
```

- [ ] **Step 2: 提交**

```bash
git add src/renderer/src/stores/layout.ts
git commit -m "feat: add layout store for Golden Layout management"
```

---

### 阶段 5：组件开发

#### Task 13: 创建 ActivityBar 组件

**Files:**
- Create: `src/renderer/src/components/ActivityBar.vue`

- [ ] **Step 1: 创建 ActivityBar 组件**

```vue
<!-- src/renderer/src/components/ActivityBar.vue -->
<template>
  <div class="activity-bar">
    <div
      v-for="item in items"
      :key="item.id"
      class="activity-item"
      :class="{ active: item.id === activeId }"
      @click="handleSelect(item.id)"
    >
      <el-icon :size="24">
        <component :is="item.icon" />
      </el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChatDotRound, Setting } from '@element-plus/icons-vue'

interface MenuItem {
  id: string
  icon: any
  label: string
}

const activeId = ref('ai-chat')

const items: MenuItem[] = [
  { id: 'ai-chat', icon: ChatDotRound, label: 'AI 对话' },
  { id: 'settings', icon: Setting, label: '设置' }
]

const emit = defineEmits<{
  select: [id: string]
}>()

function handleSelect(id: string) {
  activeId.value = id
  emit('select', id)
}
</script>

<style scoped>
.activity-bar {
  width: 48px;
  height: 100%;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 8px;
}

.activity-item {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.activity-item:hover {
  color: var(--text-primary);
}

.activity-item.active {
  color: var(--accent-color);
  border-left: 2px solid var(--accent-color);
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add src/renderer/src/components/ActivityBar.vue
git commit -m "feat: add ActivityBar component"
```

---

#### Task 14: 创建 Sidebar 组件

**Files:**
- Create: `src/renderer/src/components/Sidebar.vue`

- [ ] **Step 1: 创建 Sidebar 组件**

```vue
<!-- src/renderer/src/components/Sidebar.vue -->
<template>
  <div class="sidebar" v-show="activeModule === 'ai-chat'">
    <AIList />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAIModelsStore } from '@/stores/aiModels'
import AIList from './AIList.vue'

const activeModule = ref('ai-chat')
const aiModelsStore = useAIModelsStore()

onMounted(() => {
  aiModelsStore.loadModels()
})
</script>

<style scoped>
.sidebar {
  width: 250px;
  height: 100%;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add src/renderer/src/components/Sidebar.vue
git commit -m "feat: add Sidebar container component"
```

---

#### Task 15: 创建 AIList 组件

**Files:**
- Create: `src/renderer/src/components/AIList.vue`

- [ ] **Step 1: 创建 AIList 组件**

```vue
<!-- src/renderer/src/components/AIList.vue -->
<template>
  <div class="ai-list">
    <div v-if="aiModelsStore.loading" class="loading">
      加载中...
    </div>
    <div v-else-if="aiModelsStore.error" class="error">
      {{ aiModelsStore.error }}
    </div>
    <div
      v-for="model in aiModelsStore.models"
      :key="model.id"
      class="ai-item"
      @click="handleSelectModel(model)"
    >
      <img :src="model.icon" @error="handleImageError" class="ai-icon" />
      <span class="ai-name">{{ model.name }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAIModelsStore } from '@/stores/aiModels'
import { useTabsStore } from '@/stores/tabs'
import type { AIModel } from '@shared/types'

const aiModelsStore = useAIModelsStore()
const tabsStore = useTabsStore()

function handleSelectModel(model: AIModel) {
  tabsStore.openTab(model)
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/icons/default-ai.svg'
}
</script>

<style scoped>
.ai-list {
  padding: 8px;
}

.loading, .error {
  padding: 16px;
  text-align: center;
  color: var(--text-secondary);
}

.error {
  color: #f14c4c;
}

.ai-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.ai-item:hover {
  background: var(--hover-color);
}

.ai-icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  border-radius: 4px;
}

.ai-name {
  flex: 1;
  color: var(--text-primary);
}
</style>
```

- [ ] **Step 2: 创建默认 AI 图标**

```svg
<!-- resources/icons/default-ai.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
</svg>
```

- [ ] **Step 3: 提交**

```bash
git add src/renderer/src/components/AIList.vue resources/icons/default-ai.svg
git commit -m "feat: add AIList component with model selection"
```

---

#### Task 16: 创建 TabContainer 组件（集成 Golden Layout）

**Files:**
- Create: `src/renderer/src/components/TabContainer.vue`
- Create: `src/renderer/src/layouts/GoldenLayoutConfig.ts`
- Create: `src/renderer/src/components/GoldenLayoutComponent.vue`

- [ ] **Step 1: 创建 Golden Layout 配置**

```typescript
// src/renderer/src/layouts/GoldenLayoutConfig.ts
import { LayoutConfig } from '@shared/types'

export const goldenLayoutConfig: LayoutConfig = {
  settings: {
    showPopoutIcon: false,
    showMaximiseIcon: false,
    showCloseIcon: false,
    hasHeaders: true,
    tabControlOffset: 10,
    reorderEnabled: true,
    splitMode: 'vertical',
  },
  dimensions: {
    borderWidth: 4,
    minimumPixelWidth: 200,
    minimumPixelHeight: 150,
    headerHeight: 35,
  }
}

export const getComponentConfig = (model: any) => ({
  type: 'component',
  componentType: 'webview-container',
  componentState: {
    modelId: model.id,
    modelName: model.name,
    modelUrl: model.url,
    modelIcon: model.icon
  },
  title: model.name
})
```

- [ ] **Step 2: 创建 Golden Layout 包装组件**

```vue
<!-- src/renderer/src/components/GoldenLayoutComponent.vue -->
<template>
  <div class="golden-layout-container" ref="layoutRef"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, h } from 'vue'
import GoldenLayout from 'golden-layout'
import WebViewContainer from './WebViewContainer.vue'

const props = defineProps<{
  tabs: any[]
  activeTabId: string | null
}>()

const emit = defineEmits<{
  close: [tabId: string]
  activate: [tabId: string]
}>()

const layoutRef = ref<HTMLElement>()
let layout: any = null

onMounted(() => {
  layout = new GoldenLayout(layoutRef.value!, goldenLayoutConfig)

  // 注册 Vue 组件
  layout.registerComponentFactory('webview-container', (container: any, componentState: any) => {
    // 创建 Vue 组件实例
    const wrapper = document.createElement('div')
    wrapper.style.height = '100%'
    wrapper.style.width = '100%'
    
    // 使用 Vue 的渲染函数
    const vnode = h(WebViewContainer, {
      src: componentState.modelUrl,
      model: componentState,
      onClose: () => emit('close', componentState.modelId),
      onRefresh: () => {
        const webview = wrapper.querySelector('webview')
        if (webview) (webview as any).reload()
      }
    })
    
    container.element.appendChild(wrapper)
    // 注意：这里需要使用 Vue 的 mount 函数来实际渲染组件
    // 实际实现可能需要更复杂的处理
  })

  // 监听标签激活事件
  layout.on('tabActivated', (tab: any) => {
    const component = tab.componentItem.component
    if (component) {
      emit('activate', component.componentState.modelId)
    }
  })

  // 监听标签关闭事件
  layout.on('itemClosed', (item: any) => {
    const component = item.component
    if (component) {
      emit('close', component.componentState.modelId)
    }
  })

  // 监听拖拽到窗口外
  layout.on('itemDropped', (item: any, event: DragEvent) => {
    if (isOutsideWindow(event)) {
      handleDropToIndependentWindow(item, event)
    }
  })
})

onBeforeUnmount(() => {
  if (layout) {
    layout.destroy()
  }
})

function isOutsideWindow(event: DragEvent): boolean {
  return event.clientX <= 0 || event.clientY <= 0 ||
         event.clientX >= window.innerWidth ||
         event.clientY >= window.innerHeight
}

async function handleDropToIndependentWindow(item: any, event: DragEvent) {
  const component = item.component
  if (!component) return

  const bounds = {
    x: event.screenX,
    y: event.screenY,
    width: 800,
    height: 600
  }

  try {
    await window.electronAPI.createIndependentWindow(component.componentState, bounds)
    item.close()
  } catch (error) {
    console.error('Failed to create independent window:', error)
  }
}
</script>

<style scoped>
.golden-layout-container {
  width: 100%;
  height: 100%;
}

:deep(.lm_content) {
  background: var(--bg-primary);
}

:deep(.lm_header) {
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

:deep(.lm_tab) {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

:deep(.lm_tab.lm_active) {
  background: var(--bg-primary);
  color: var(--text-primary);
  border-bottom: 2px solid var(--accent-color);
}
</style>
```

- [ ] **Step 3: 创建 TabContainer 组件**

```vue
<!-- src/renderer/src/components/TabContainer.vue -->
<template>
  <div class="tab-container">
    <div v-if="tabsStore.tabs.length === 0" class="empty-state">
      <p>请从左侧选择一个 AI 模型开始对话</p>
    </div>
    <GoldenLayoutComponent
      v-else
      :tabs="tabsStore.tabs"
      :active-tab-id="tabsStore.activeTabId"
      @close="handleCloseTab"
      @activate="handleActivateTab"
    />
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useTabsStore } from '@/stores/tabs'
import GoldenLayoutComponent from './GoldenLayoutComponent.vue'

const tabsStore = useTabsStore()

function handleCloseTab(tabId: string) {
  tabsStore.closeTab(tabId)
}

function handleActivateTab(tabId: string) {
  tabsStore.activateTab(tabId)
}

// 监听 tabs 变化，更新 Golden Layout
watch(() => tabsStore.tabs.length, (newLength, oldLength) => {
  if (newLength === 0) {
    tabsStore.isFirstOpen = true
  }
})
</script>

<style scoped>
.tab-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}
</style>
```

- [ ] **Step 4: 提交**

```bash
git add src/renderer/src/components/TabContainer.vue src/renderer/src/layouts/GoldenLayoutConfig.ts src/renderer/src/components/GoldenLayoutComponent.vue
git commit -m "feat: add TabContainer with Golden Layout integration"
```

---

#### Task 17: 创建 TabItem 组件

**Files:**
- Create: `src/renderer/src/components/TabItem.vue`

- [ ] **Step 1: 创建 TabItem 组件**

```vue
<!-- src/renderer/src/components/TabItem.vue -->
<template>
  <div class="tab-item" :class="{ active }" @click="$emit('activate')">
    <img :src="model.icon" @error="handleImageError" class="tab-icon" />
    <span class="tab-name">{{ model.name }}</span>
    <button class="tab-refresh" @click.stop="$emit('refresh')">
      ↻
    </button>
    <button class="tab-close" @click.stop="$emit('close')">
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import type { AIModel } from '@shared/types'

defineProps<{
  model: AIModel
  isActive: boolean
}>()

defineEmits<{
  close: []
  refresh: []
  activate: []
}>()

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/icons/default-ai.svg'
}
</script>

<style scoped>
.tab-item {
  display: flex;
  align-items: center;
  height: 35px;
  padding: 0 12px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  user-select: none;
}

.tab-item.active {
  background: var(--bg-primary);
  border-bottom: 1px solid transparent;
}

.tab-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border-radius: 2px;
}

.tab-name {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-refresh, .tab-close {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.tab-refresh:hover, .tab-close:hover {
  background: var(--hover-color);
  color: var(--text-primary);
}

.tab-close {
  margin-left: 4px;
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add src/renderer/src/components/TabItem.vue
git commit -m "feat: add TabItem component with icon, name, refresh and close"
```

---

#### Task 18: 创建 WebViewContainer 组件

**Files:**
- Create: `src/renderer/src/components/WebViewContainer.vue`

- [ ] **Step 1: 创建 WebViewContainer 组件**

```vue
<!-- src/renderer/src/components/WebViewContainer.vue -->
<template>
  <div class="webview-container">
    <webview
      :src="src"
      :data-tab-id="model.id"
      class="webview"
      @dom-ready="handleDomReady"
      @did-finish-load="handleFinishLoad"
      @did-fail-load="handleFailLoad"
    ></webview>
    <div v-if="loadError" class="error-state">
      <p>加载失败</p>
      <p class="error-message">{{ loadError.description }}</p>
      <button @click="handleRetry">重试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { AIModel } from '@shared/types'

const props = defineProps<{
  src: string
  model: AIModel
}>()

const loadError = ref<any>(null)

function handleDomReady() {
  console.log('WebView dom ready:', props.model.name)
}

function handleFinishLoad() {
  console.log('WebView loaded:', props.model.name)
  loadError.value = null
}

function handleFailLoad(event: any) {
  console.error('WebView load failed:', props.model.name, event)
  loadError.value = {
    code: event.errorCode,
    description: event.errorDescription
  }
}

function handleRetry() {
  loadError.value = null
  const webview = document.querySelector(`webview[data-tab-id="${props.model.id}"]`) as any
  if (webview) {
    webview.reload()
  }
}
</script>

<style scoped>
.webview-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.webview {
  width: 100%;
  height: 100%;
  border: none;
}

.error-state {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.error-message {
  color: var(--text-secondary);
  margin: 8px 0 16px;
}

.error-state button {
  padding: 8px 16px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error-state button:hover {
  opacity: 0.9;
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add src/renderer/src/components/WebViewContainer.vue
git commit -m "feat: add WebViewContainer component with error handling"
```

---

#### Task 19: 创建设置相关组件

**Files:**
- Create: `src/renderer/src/components/SettingsButton.vue`
- Create: `src/renderer/src/components/SettingsDialog.vue`

- [ ] **Step 1: 创建设置按钮组件**

```vue
<!-- src/renderer/src/components/SettingsButton.vue -->
<template>
  <button class="settings-button" @click="handleClick">
    ⚙
  </button>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

function handleClick() {
  themeStore.setSettingsVisible(true)
}
</script>

<style scoped>
.settings-button {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 100;
}

.settings-button:hover {
  background: var(--hover-color);
  transform: scale(1.1);
}
</style>
```

- [ ] **Step 2: 创建设置弹窗组件**

```vue
<!-- src/renderer/src/components/SettingsDialog.vue -->
<template>
  <el-dialog
    v-model="visible"
    title="设置"
    width="500px"
  >
    <el-form label-width="100px">
      <el-form-item label="主题">
        <el-radio-group v-model="themeStore.theme" @change="handleThemeChange">
          <el-radio :label="THEME.AUTO">跟随系统</el-radio>
          <el-radio :label="THEME.DARK">深色</el-radio>
          <el-radio :label="THEME.LIGHT">浅色</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { THEME } from '@shared/constants'

const themeStore = useThemeStore()

const visible = computed({
  get: () => themeStore.settingsVisible,
  set: (val) => themeStore.setSettingsVisible(val)
})

function handleThemeChange(value: THEME) {
  themeStore.setTheme(value)
}
</script>
```

- [ ] **Step 3: 提交**

```bash
git add src/renderer/src/components/SettingsButton.vue src/renderer/src/components/SettingsDialog.vue
git commit -m "feat: add settings button and dialog components"
```

---

#### Task 20: 更新 App.vue 以集成所有组件

**Files:**
- Modify: `src/renderer/src/App.vue`

- [ ] **Step 1: 更新 App.vue（添加窗口类型检测）**

```vue
<!-- src/renderer/src/App.vue -->
<template>
  <div class="app-container" :class="themeClass">
    <!-- 主窗口：显示完整的 UI -->
    <!-- 独立窗口：只显示 TabContainer 和 SettingsButton -->
    <template v-if="isIndependentWindow">
      <TabContainer />
      <SettingsButton />
      <SettingsDialog />
    </template>
    <template v-else>
      <ActivityBar />
      <Sidebar />
      <TabContainer />
      <SettingsButton />
      <SettingsDialog />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useTabsStore } from '@/stores/tabs'
import ActivityBar from '@/components/ActivityBar.vue'
import Sidebar from '@/components/Sidebar.vue'
import TabContainer from '@/components/TabContainer.vue'
import SettingsButton from '@/components/SettingsButton.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'

const themeStore = useThemeStore()
const tabsStore = useTabsStore()

// 检测是否为独立窗口
const isIndependentWindow = ref(false)

const themeClass = computed(() => ({
  'theme-dark': themeStore.currentTheme === 'dark',
  'theme-light': themeStore.currentTheme === 'light'
}))

onMounted(() => {
  themeStore.syncSystemTheme()
  themeStore.initThemeListener()
  
  // 检查 URL 参数判断窗口类型
  const urlParams = new URLSearchParams(window.location.search)
  isIndependentWindow.value = urlParams.get('type') === 'independent'
  
  // 独立窗口：监听初始化标签
  if (isIndependentWindow.value) {
    window.electronAPI.onInitTab((tabData) => {
      tabsStore.openTab(tabData)
    })
  }
})
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add src/renderer/src/App.vue
git commit -m "feat: update App.vue to integrate all components"
```

---

### 阶段 6：构建配置和最终测试

#### Task 21: 配置开发环境和构建

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 更新 package.json 添加构建脚本**

```json
{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "build:win": "npm run build && electron-builder --win",
    "build:mac": "npm run build && electron-builder --mac",
    "build:linux": "npm run build && electron-builder --linux"
  },
  "build": {
    "appId": "com.onechat.app",
    "productName": "OneChat",
    "directories": {
      "output": "dist"
    },
    "files": [
      "dist/**/*",
      "online/**/*",
      "resources/**/*"
    ],
    "win": {
      "target": ["nsis"]
    },
    "mac": {
      "target": ["dmg"]
    },
    "linux": {
      "target": ["AppImage"]
    }
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add package.json
git commit -m "feat: add build configuration"
```

---

#### Task 22: 创建 README 文档

**Files:**
- Create: `README.dev.md`

- [ ] **Step 1: 创建开发文档**

```markdown
# OneChat Electron 版本 - 开发文档

## 开发环境设置

### 安装依赖
\`\`\`bash
npm install
\`\`\`

### 开发模式
\`\`\`bash
npm run dev
\`\`\`

### 构建
\`\`\`bash
npm run build
\`\`\`

### 打包
\`\`\`bash
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
\`\`\`

## 项目结构

- `src/main/` - 主进程代码
- `src/preload/` - Preload 脚本
- `src/renderer/` - 渲染进程代码（Vue3）
- `src/shared/` - 共享类型和常量
- `online/` - AI 模型配置

## 技术栈

- Electron
- Vue3 + TypeScript
- Element Plus
- Pinia
- webview
