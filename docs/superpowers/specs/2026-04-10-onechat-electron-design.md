# OneChat Electron 版本设计文档

**项目名称：** OneChat Electron 版本
**设计日期：** 2026-04-10
**版本：** 1.0.0
**状态：** 设计阶段

---

## 1. 项目概述

### 1.1 项目目标

完全替代现有的 Qt 版本 OneChat，功能对等迁移。OneChat 是一个可以同时与多个 AI 网站对话的工具，用户可以发送一个问题到多个 AI 页面，帮助用户发现最佳答案。

### 1.2 核心需求

- VSCode 风格的界面布局
- 同时打开多个 AI 网页（ChatGPT、Claude、DeepSeek 等）
- 标签页支持拖拽、分栏、独立窗口
- 同一 AI 模型只允许打开一个标签页
- 支持深色/浅色主题，默认跟随系统
- 从配置文件动态读取 AI 模型列表

### 1.3 技术栈

- **Electron:** 最新稳定版
- **前端框架:** Vue3 + TypeScript
- **UI 组件库:** Element Plus
- **状态管理:** Pinia
- **布局库:** Golden Layout (Vue3 适配版)
- **网页加载:** webview 标签

---

## 2. 整体架构

### 2.1 进程模型

```
┌─────────────────────────────────────────────────────────────┐
│                         主进程                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  窗口管理     │  │  配置读取     │  │  主题管理     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ↕ IPC
┌─────────────────────────────────────────────────────────────┐
│                      渲染进程 (Vue3)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  UI 渲染      │  │  布局管理     │  │  状态管理     │     │
│  │  (Vue组件)    │  │  (Golden     │  │  (Pinia)     │     │
│  │              │  │   Layout)    │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              WebView 容器 (加载 AI 网页)              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构

```
src/
├── main/                 # 主进程代码
│   ├── index.ts         # 入口
│   ├── window.ts        # 窗口管理
│   ├── config.ts        # 配置读取
│   └── ipc.ts           # IPC 处理
├── renderer/            # 渲染进程代码
│   ├── src/
│   │   ├── App.vue
│   │   ├── components/  # Vue 组件
│   │   │   ├── ActivityBar.vue
│   │   │   ├── Sidebar.vue
│   │   │   ├── AIList.vue
│   │   │   ├── TabContainer.vue
│   │   │   ├── TabItem.vue
│   │   │   ├── WebViewContainer.vue
│   │   │   ├── SettingsButton.vue
│   │   │   └── SettingsDialog.vue
│   │   ├── stores/      # Pinia stores
│   │   │   ├── aiModels.ts
│   │   │   ├── tabs.ts
│   │   │   ├── theme.ts
│   │   │   └── layout.ts
│   │   ├── layouts/     # Golden Layout 配置
│   │   ├── styles/      # 样式文件
│   │   └── main.ts
│   └── index.html
├── preload/             # Preload 脚本
└── shared/              # 共享代码（类型、常量）
```

---

## 3. 组件设计

### 3.1 布局组件

#### App.vue
- **职责：** 应用根组件，负责整体布局组装和主题切换
- **状态：** 当前主题、Activity Bar 选中项

#### ActivityBar.vue
- **职责：** 最左侧的功能图标栏，垂直排列
- **Props:** `items: MenuItem[]`, `activeId: string`
- **Events:** `@select(itemId)`
- **初始功能：** AI对话、设置（预留扩展位置）

#### Sidebar.vue
- **职责：** 侧边栏面板容器，根据 Activity Bar 选择显示不同内容
- **Props:** `activeModule: string`
- **子内容：** AIList.vue、History.vue 等

### 3.2 AI 列表组件

#### AIList.vue
- **职责：** 显示从 online.json 读取的 AI 模型列表
- **数据源：** Pinia Store (aiModels)
- **交互：** 点击 → 创建新标签（智能分栏）
- **列表项：** 图标 + 名称

### 3.3 标签页系统组件

#### TabContainer.vue (核心组件)
- **职责：** 集成 Golden Layout，管理分栏和标签页系统
- **方法：**
  - `openTab(model)` - 打开标签（检查重复）
  - `closeTab(tabId)` - 关闭标签
  - `splitTab(tabId, direction)` - 分栏操作
  - `moveTab(tabId, targetWindow)` - 移动标签到其他窗口

#### TabItem.vue
- **职责：** 单个标签页组件
- **内容：** AI 图标 + 名称 + 刷新按钮 + 关闭按钮
- **Props:** `model: AIModel`, `isActive: boolean`
- **Events:** `@close`, `@refresh`, `@dragStart`

### 3.4 WebView 组件

#### WebViewContainer.vue
- **职责：** 包装 webview 标签，管理单个 AI 网页加载
- **Props:** `src: string`, `model: AIModel`
- **职责：**
  - 加载 AI 网站 URL
  - 监听加载事件（开始、完成、失败）
  - 处理页面刷新
  - 管理 webview 生命周期

### 3.5 设置组件

#### SettingsButton.vue
- **职责：** 右下角齿轮按钮，点击打开设置弹窗
- **位置：** fixed, right: 20px, bottom: 20px

#### SettingsDialog.vue
- **职责：** 设置弹窗，使用 el-dialog
- **设置项：**
  - 主题选择：跟随系统 / 深色 / 浅色
  - （预留扩展位置）

---

## 4. 数据流设计

### 4.1 Pinia Store 结构

#### useAIModelsStore
```typescript
State:
  - models: AIModel[]  // 从 online.json 加载

Actions:
  - loadModels()  // 通过 IPC 从主进程读取配置

Getters:
  - getModelById(id)
  - getModelsByGroup(group)
```

#### useTabsStore
```typescript
State:
  - tabs: Tab[]
  - activeTabId: string
  - isFirstOpen: boolean

Actions:
  - openTab(model)  // 检查重复，智能分栏
  - closeTab(id)
  - splitTab(id, direction)
  - moveTab(tabId, targetWindow)

Getters:
  - activeTab
  - tabsByWindow
```

#### useThemeStore
```typescript
State:
  - theme: 'auto' | 'dark' | 'light'
  - systemTheme: string

Actions:
  - setTheme(theme)
  - syncSystemTheme()

Getters:
  - currentTheme  // 返回实际应用的主题
```

#### useLayoutStore
```typescript
State:
  - goldenLayout: GoldenLayout 实例
  - isFirstOpen: boolean

Actions:
  - initLayout()
  - createComponent(model)
  - handleDrop()
```

### 4.2 核心数据流

#### 启动流程
```
主进程：读取 online.json
    ↓ IPC
渲染进程：useAIModelsStore.loadModels()
    ↓
AIList.vue 渲染模型列表
```

#### 打开 AI 标签流程
```
用户点击 AIList 中的模型
    ↓
AIList.vue → useTabsStore.openTab(model)
    ↓
检查：该模型是否已有打开的标签？
    ↓
分支A：存在 → 切换到现有标签
分支B：不存在 → 创建新标签
    ↓
判断是否首次打开？
    ↓
是 → 在主区域创建
否 → 在最右侧添加新分栏
    ↓
Golden Layout 创建 WebViewContainer
    ↓
WebViewContainer 加载 AI 网站
```

#### 标签拖拽到独立窗口流程
```
用户开始拖拽标签
    ↓
Golden Layout 检测拖拽到窗口外
    ↓ IPC
主进程：创建新的 BrowserWindow（系统标题栏）
    ↓ IPC
新窗口：接收标签数据，创建 WebViewContainer
    ↓
主窗口：关闭原标签
```

### 4.3 IPC 通信定义

#### 渲染进程 → 主进程
- `config:read-online-json` → 读取 AI 模型配置
- `window:create-independent` → 创建独立窗口
- `window:close-all` → 关闭所有窗口
- `theme:get-system` → 获取系统主题

#### 主进程 → 渲染进程
- `theme:system-changed` → 系统主题变化通知
- `window:tab-dropped` → 标签拖入窗口通知

---

## 5. 窗口和布局管理

### 5.1 主窗口配置

```typescript
{
  frame: true,              // 使用系统默认标题栏
  minWidth: 1200,
  minHeight: 800,
  width: 1400,
  height: 900,
  resizable: true,
  webPreferences: {
    webviewTag: true,       // 启用 webview 标签
    nodeIntegration: false,
    contextIsolation: true
  }
}
```

**窗口内容：**
- Activity Bar（左侧，48px 宽）
- Sidebar Panel（左侧，250px 宽，可调整）
- TabContainer（中心区域，填充剩余空间）
- SettingsButton（右下角，固定位置）

### 5.2 独立窗口配置

```typescript
{
  frame: true,              // 使用系统默认标题栏
  minWidth: 600,
  minHeight: 400,
  resizable: true,
  webPreferences: {
    webviewTag: true,
    nodeIntegration: false,
    contextIsolation: true
  }
}
```

**窗口内容：**
- 只有 TabContainer（无 Activity Bar、无 Sidebar）
- 支持多标签页
- 支持分栏
- 可接收从其他窗口拖入的标签

**生命周期：**
- 主窗口关闭时，所有独立窗口同时关闭
- 独立窗口关闭时，标签不返回主窗口（直接销毁）

### 5.3 Golden Layout 配置

```typescript
const config = {
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
```

### 5.4 分栏策略

**简化的分栏逻辑：**
- **第一次打开：** 在主区域创建单个标签
- **后续每次打开：** 始终在最右侧添加新分栏

```typescript
openTab(model: AIModel) {
  const existingTab = this.tabs.find(t => t.modelId === model.id)

  if (existingTab) {
    this.activateTab(existingTab.id)
  } else {
    if (this.isFirstOpen) {
      this.goldenLayout.addComponentAtRoot(model)
      this.isFirstOpen = false
    } else {
      this.goldenLayout.addComponentToRight(model)
    }
  }
}
```

---

## 6. 约束规则

### 6.1 唯一性约束
- 同一 AI 模型只能有一个标签页
- 点击已打开模型的列表项 → 切换到现有标签
- 同一模型在不同窗口中也只能有一个实例
- 不能将同一模型的标签拖拽到有同模型标签的窗口

### 6.2 交互约束
- 打开新标签：只能从 Sidebar AI 列表点击打开
- 不支持快捷键（后续版本添加）
- AI 列表项不支持右键菜单
- 每次点击 AI 列表项都在新分栏中打开（最右侧）

---

## 7. 错误处理

### 7.1 配置文件错误
- **文件不存在：** 显示友好提示，引导用户检查安装目录
- **格式错误：** 显示具体错误位置，提示用户修复
- **配置不完整：** 跳过不完整配置，记录警告日志

### 7.2 WebView 加载错误
- **加载失败：** 在标签页中显示错误提示页面，提供重试按钮
- **加载超时：** 30秒超时，显示超时提示
- **网站拒绝连接：** 显示说明，告知用户可能需要 VPN

### 7.3 窗口和标签错误
- **拖拽失败：** 标签保留在原位置，显示 Toast 提示
- **独立窗口意外关闭：** 主窗口检测到 IPC 断开，清理状态
- **拖入重复模型：** 拒绝拖入，切换到现有标签，显示提示

### 7.4 资源错误
- **图标缺失：** 使用默认图标替代
- **内存过高：** 打开超过10个标签时显示警告

### 7.5 错误日志
- **位置：** `%USERDATA%/logs/`
- **格式：** 按日期分割
- **清理：** 自动删除30天前的日志

---

## 8. 后续扩展（暂不实现）

以下功能在后续版本中考虑：
- 同步控制功能（一键显示/隐藏所有页面的侧边栏、输入框等）
- 布局状态持久化（重启后恢复标签页和分栏布局）
- 快捷键支持
- AI 列表项右键菜单
- 代理设置

---

## 9. 设计完成确认

本设计文档包含以下章节：
1. ✅ 项目概述
2. ✅ 整体架构
3. ✅ 组件设计
4. ✅ 数据流设计
5. ✅ 窗口和布局管理
6. ✅ 约束规则
7. ✅ 错误处理

**设计状态：** 待用户确认后进入实施计划阶段

---

*文档版本：* 1.0.0
*最后更新：* 2026-04-10
