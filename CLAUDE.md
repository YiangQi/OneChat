# OneChat - Claude Code 项目说明

## 项目概述

OneChat 是一个基于 Electron 的应用程序，允许用户从单个界面与多个 AI 模型交互。使用 Vue 3、TypeScript 和 Element Plus 构建。

## 已知问题与解决方案

### ELECTRON_RUN_AS_NODE 环境变量问题

**症状：** Electron 应用启动失败，报错：
```
TypeError: Cannot read properties of undefined (reading 'whenReady')
    at Object.<anonymous> (D:\work\PERSONAL\OneChat\out\main\index.js:182:14)
```

**原因：** 系统中设置了 `ELECTRON_RUN_AS_NODE=1` 环境变量，导致 Electron 以普通 Node.js 进程运行而不是 Electron 运行时。这使得 `electron.app` 为 undefined。

**解决方案：**

**临时方案（仅当前会话）：**
```bash
bash -c "unset ELECTRON_RUN_AS_NODE && npm run dev"
```

**永久方案：** 从 Windows 环境变量中删除：
1. 按 `Win + R`，输入 `sysdm.cpl` 并回车
2. 进入 **高级** 选项卡 → **环境变量**
3. 在用户变量或系统变量中找到 `ELECTRON_RUN_AS_NODE`
4. 选中并点击 **删除**
5. 重启终端

## 开发命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 测试
npm run test              # Vitest 单元测试
npm run test:ui           # Vitest UI 界面
npm run test:coverage     # 测试覆盖率报告
npm run test:e2e          # Playwright E2E 测试
npm run test:e2e:ui       # Playwright UI 界面

# Windows 打包
npm run build:win
```

## 项目架构

- **主进程：** `src/main/index.ts` - Electron 主进程，窗口管理
- **预加载脚本：** `src/preload/index.ts` - IPC 上下文桥接
- **渲染进程：** `src/renderer/src/` - Vue 3 应用程序
- **共享类型：** `src/shared/types.ts` - TypeScript 接口定义

## 核心组件

- `App.vue` - 主应用布局，包含 ActivityBar、Sidebar、TabContainer
- `ActivityBar.vue` - 左侧图标栏，用于模块选择
- `Sidebar.vue` - 可调整大小的侧边栏，显示 AI 模型列表
- `TabContainer.vue` - 标签页栏，管理已打开的 AI 模型
- `WebViewContainer.vue` - Webview 包装器，加载 AI 模型网页

## 自定义协议

应用使用自定义的 `online://` 协议来提供本地资源（图标等），从 `online/` 目录加载。在 `src/main/index.ts` 中注册。

## 状态管理

- Pinia stores 位于 `src/renderer/src/stores/`：
  - `themeStore.ts` - 主题管理（浅色/深色）
  - `aiModelsStore.ts` - AI 模型配置
  - `tabsStore.ts` - 打开的标签页管理
