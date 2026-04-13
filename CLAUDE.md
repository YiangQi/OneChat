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

## Webview 注入脚本调试指南

当调试或开发新的 AI 模型注入脚本（位于 `online/*/inject.js`）时，使用以下方法可以高效地定位和解决问题：

### 1. 创建 E2E 测试进行实际调试

不要使用 iframe 模拟，而是启动真实的 Electron 应用进行调试。参考 [aliyun_tongyi-injection.spec.ts](tests/e2e/aliyun_tongyi-injection.spec.ts)：

```typescript
import { test, expect } from '@playwright/test';
import { getMainWindow, launchElectronApp } from './helpers/electron';

test('debug webview', async () => {
  const electronApp = await launchElectronApp();
  const mainWindow = await getMainWindow(electronApp);

  // 等待应用加载
  await mainWindow.waitForTimeout(3000);

  // 点击目标 AI 模型按钮
  const modelItems = await mainWindow.locator('.ai-item').all();
  // ... 找到并点击目标模型

  const webview = mainWindow.locator('webview').first();

  // 在 webview 上下文中执行脚本
  const result = await mainWindow.evaluate(async (data) => {
    const { webviewEl, script } = data;
    const wv = webviewEl as any;
    if (wv && wv.executeJavaScript) {
      return await wv.executeJavaScript(script);
    }
    return { error: 'webview not ready' };
  }, { webviewEl: await webview.elementHandle(), script: yourDebugScript });

  console.log('结果:', result);
});
```

### 2. DOM 结构检查脚本

使用以下模板检查页面 DOM 结构：

```javascript
(function() {
  // 找到关键容器
  const scrollbar = document.querySelector('div[class*="sider-scrollbar"]');
  if (!scrollbar) return { error: 'No scrollbar' };

  const allItems = Array.from(scrollbar.children);
  const result = {
    totalItems: allItems.length,
    items: []
  };

  for (let i = 0; i < Math.min(10, allItems.length); i++) {
    const item = allItems[i];
    result.items.push({
      index: i,
      tagName: item.tagName,
      className: item.className,
      textContent: (item.textContent || '').trim().substring(0, 50),
      hasClickHandler: !!item.getAttribute('onclick'),
      hasRoleButton: item.getAttribute('role') === 'button',
      // 查找可点击的子元素
      clickableChildren: Array.from(item.querySelectorAll('*')).filter(child => {
        return child.getAttribute('onclick') ||
               child.getAttribute('role') === 'button' ||
               child.tagName === 'BUTTON' ||
               child.classList.contains('cursor-pointer');
      }).map(child => ({
        tagName: child.tagName,
        className: child.className,
        textContent: (child.textContent || '').trim().substring(0, 30)
      }))
    });
  }

  return result;
})()
```

### 3. 测试不同点击方法

某些网站的事件处理可能比较特殊，尝试多种点击方式：

```javascript
// 方法1: 直接 click()
element.click();

// 方法2: 派发鼠标事件
element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
element.dispatchEvent(new MouseEvent('click', { bubbles: true }));

// 方法3: 使用 HTMLElement.click()
HTMLElement.prototype.click.call(element);

// 方法4: 焦点 + 回车
element.focus();
element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
```

### 4. 状态检测方法

对于侧边栏等 UI 元素，不同网站使用不同方式控制显示/隐藏：

```javascript
// 检测 display 属性
const isVisibleByDisplay = getComputedStyle(element).display !== 'none';

// 检测 CSS transform（如 translateX）
const transformContainer = document.querySelector('div[class*="translate-x"]');
let isVisible = false;
if (transformContainer) {
  const classList = transformContainer.classList;
  isVisible = !classList.contains('-translate-x-full') &&
                !classList.contains('translate-x-full');
}

// 检测宽度
const isVisibleByWidth = element.getBoundingClientRect().width > 0;
```

### 5. 异步操作和动画等待

许多 UI 操作包含动画或异步加载，需要适当等待：

```javascript
// 使用 setTimeout 等待动画完成
setTimeout(() => {
  // 动画完成后执行操作
}, 600); // 根据实际动画时长调整

// 或使用 Promise 包装
return new Promise(resolve => {
  setTimeout(() => {
    resolve({ result: 'done' });
  }, 1000);
});
```

### 6. 日志调试

在 inject.js 中添加详细日志：

```javascript
function onSidebarVisibleChanged(visible) {
    console.log('[Model Name] onSidebarVisibleChanged called, visible:', visible);

    // 检查当前状态
    const transformContainer = document.querySelector('div[class*="translate-x"]');
    let isSidebarVisible = false;

    if (transformContainer) {
        const classList = transformContainer.classList;
        isSidebarVisible = !classList.contains('-translate-x-full');
    }

    console.log('[Model Name] Current state:', isSidebarVisible, 'target:', visible);

    // 如果状态已匹配，直接返回
    if (isSidebarVisible === visible) {
        console.log('[Model Name] Already in target state');
        return true;
    }

    // ... 执行操作
}
```

### 7. 常见问题排查

| 问题 | 可能原因 | 解决方法 |
|------|----------|----------|
| 点击无响应 | 点击了错误的元素 | 使用 DOM 检查脚本找到正确的可点击元素 |
| 状态检测不准确 | 使用了错误的检测方式 | 尝试 display、transform、宽度等多种检测方式 |
| 操作不生效 | 需要等待动画/异步操作 | 添加适当的 setTimeout 等待 |
| 找不到元素 | 选择器错误或元素未加载 | 检查选择器，添加重试逻辑 |

### 8. 现有测试参考

- [chatglm-injection.spec.ts](tests/e2e/chatglm-injection.spec.ts) - ChatGLM 注入脚本测试
- [aliyun_tongyi-injection.spec.ts](tests/e2e/aliyun_tongyi-injection.spec.ts) - Aliyun Tongyi 注入脚本测试（包含完整调试示例）
