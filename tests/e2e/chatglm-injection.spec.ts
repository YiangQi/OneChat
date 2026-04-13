import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getMainWindow, launchElectronApp } from './helpers/electron'

const chatglmScript = readFileSync(join(process.cwd(), 'online', 'zhipu_chatglm', 'inject.js'), 'utf-8')
const commonScript = readFileSync(join(process.cwd(), 'online', 'common_inject.js'), 'utf-8')

async function runInInjectedFrame<T>(page: Page, bodyHtml: string, action: string) {
  return page.evaluate(
    ({ bodyHtml, chatglmScript, commonScript, action }) => {
      const iframe = document.createElement('iframe')
      document.body.appendChild(iframe)

      const frameWindow = iframe.contentWindow as any
      const frameDocument = iframe.contentDocument
      if (!frameWindow || !frameDocument) {
        throw new Error('Failed to create test iframe')
      }

      frameDocument.open()
      frameDocument.write(`<!DOCTYPE html><html><head></head><body>${bodyHtml}</body></html>`)
      frameDocument.close()

      frameWindow.CallBridge = {
        listeners: {},
        addEventListener(name: string, handler: (...args: unknown[]) => void) {
          const listeners = this.listeners[name] || (this.listeners[name] = [])
          listeners.push(handler)
          return true
        },
        dispatchEvent(name: string, ...args: unknown[]) {
          const listeners = this.listeners[name] || []
          for (const listener of listeners) {
            listener(...args)
          }
          return listeners.length
        },
        invoke() {
          return true
        }
      }

      frameWindow.eval(chatglmScript)
      frameWindow.eval(commonScript)
      return frameWindow.eval(action) as T
    },
    { bodyHtml, chatglmScript, commonScript, action }
  )
}

test.describe('ChatGLM injection (E2E)', () => {
  let electronApp: Awaited<ReturnType<typeof launchElectronApp>>
  let mainWindow: Awaited<ReturnType<typeof getMainWindow>>

  test.beforeEach(async () => {
    electronApp = await launchElectronApp()
    mainWindow = await getMainWindow(electronApp)
  })

  test.afterEach(async () => {
    await electronApp.close()
  })

  test('toggles sidebar visibility through injected toolbar event', async () => {
    const result = await runInInjectedFrame<{ hidden: boolean; visibleAgain: boolean; historyClicks: number }>(
      mainWindow,
      `
        <style>
          .aside-container {
            width: 260px;
            height: 400px;
          }
          .aside-container.collapse-aside {
            width: 40px;
          }
        </style>
        <aside class="el-aside aside-container scroll-display-none">
          <div class="btn-area">
            <div class="operation-btn" onclick="window.__historyClicks = (window.__historyClicks || 0) + 1">history</div>
            <div class="operation-btn" onclick="document.querySelector('.aside-container').classList.add('collapse-aside')">collapse</div>
          </div>
        </aside>
        <div id="expanded-state">expanded</div>
      `,
      `
        CallBridge.dispatchEvent('sidebarVisibleChanged', false);
        const hidden = document.querySelector('.aside-container').classList.contains('collapse-aside');
        document.querySelector('.btn-area').innerHTML = '<div class="operation-btn" onclick="document.querySelector(\\'.aside-container\\').classList.remove(\\'collapse-aside\\')">expand</div>';
        CallBridge.dispatchEvent('sidebarVisibleChanged', true);
        const visibleAgain = !document.querySelector('.aside-container').classList.contains('collapse-aside');
        ({ hidden, visibleAgain, historyClicks: window.__historyClicks || 0 });
      `
    )

    expect(result).toEqual({ hidden: true, visibleAgain: true, historyClicks: 0 })
  })

  test('clicks the visible ChatGLM new session entry', async () => {
    const clicks = await runInInjectedFrame<number>(
      mainWindow,
      `
        <div
          class="new-session flex flex-x-start flex-y-center el-tooltip__trigger"
          onclick="window.__newChatClicks = (window.__newChatClicks || 0) + 1"
        >
          New chat
        </div>
      `,
      `
        CallBridge.dispatchEvent('chatNewButtonClicked');
        window.__newChatClicks || 0;
      `
    )

    expect(clicks).toBe(1)
  })

  test('clicks the collapsed ChatGLM new session entry', async () => {
    const clicks = await runInInjectedFrame<number>(
      mainWindow,
      `
        <div
          class="new-session flex flex-x-start flex-y-center new-session-collapse el-tooltip__trigger"
          onclick="window.__newChatClicks = (window.__newChatClicks || 0) + 1"
        ></div>
      `,
      `
        CallBridge.dispatchEvent('chatNewButtonClicked');
        window.__newChatClicks || 0;
      `
    )

    expect(clicks).toBe(1)
  })

  test('expands collapsed ChatGLM sidebar before clicking a conversation', async () => {
    const result = await runInInjectedFrame<{
      expanded: boolean
      clickedTitle: string
      conversationChangedCalls: number
    }>(
      mainWindow,
      `
        <style>
          .aside-container {
            width: 40px;
            height: 400px;
          }
          .aside-container:not(.collapse-aside) {
            width: 260px;
          }
          .aside-container.collapse-aside .history-list {
            display: none;
          }
        </style>
        <aside class="el-aside aside-container scroll-display-none collapse-aside">
          <div class="btn-area">
            <div
              class="operation-btn"
              onclick="document.querySelector('.aside-container').classList.remove('collapse-aside')"
            >
              expand
            </div>
          </div>
          <div class="history-list">
            <div
              class="history-item"
              data-conversation-id="conversation-1"
              onclick="window.__clickedTitle = this.querySelector('.title').innerText"
            >
              <div class="title">
                First conversation
              </div>
            </div>
          </div>
        </aside>
      `,
      `
        (async () => {
          const calls = [];
          const originalInvoke = CallBridge.invoke.bind(CallBridge);
          CallBridge.invoke = (name, ...args) => {
            calls.push({ name, args });
            return originalInvoke(name, ...args);
          };

          CallBridge.dispatchEvent('conversationClicked', 'conversation-1', 'First conversation');
          await new Promise(resolve => setTimeout(resolve, 900));

          return {
            expanded: !document.querySelector('.aside-container').classList.contains('collapse-aside'),
            clickedTitle: window.__clickedTitle || '',
            conversationChangedCalls: calls.filter(call => call.name === 'webConversationChanged').length
          };
        })();
      `
    )

    expect(result).toEqual({
      expanded: true,
      clickedTitle: 'First conversation',
      conversationChangedCalls: 0
    })
  })

  test('keeps generic sidebar fallback for non-ChatGLM-like pages', async () => {
    const result = await runInInjectedFrame<{ hidden: boolean; visibleAgain: boolean }>(
      mainWindow,
      `
        <style>
          #sidebar {
            display: block;
            width: 240px;
            height: 400px;
          }
        </style>
        <aside id="sidebar" class="chatglm-sidebar">history</aside>
        <button
          id="sidebar-toggle"
          aria-label="hide sidebar"
          onclick="
            const sidebar = document.querySelector('#sidebar');
            sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
            this.setAttribute('aria-label', sidebar.style.display === 'none' ? 'show sidebar' : 'hide sidebar');
          "
        >
          toggle sidebar
        </button>
      `,
      `
        CallBridge.dispatchEvent('sidebarVisibleChanged', false);
        const hidden = getComputedStyle(document.querySelector('#sidebar')).display === 'none';
        CallBridge.dispatchEvent('sidebarVisibleChanged', true);
        const visibleAgain = getComputedStyle(document.querySelector('#sidebar')).display !== 'none';
        ({ hidden, visibleAgain });
      `
    )

    expect(result).toEqual({ hidden: true, visibleAgain: true })
  })

  test('clicks the ChatGLM new conversation button through injected toolbar event', async () => {
    const clicks = await runInInjectedFrame<number>(
      mainWindow,
      `
        <button
          id="new-chat"
          aria-label="new chat"
          onclick="window.__newChatClicks = (window.__newChatClicks || 0) + 1"
        >
          New chat
        </button>
      `,
      `
        CallBridge.dispatchEvent('chatNewButtonClicked');
        window.__newChatClicks || 0;
      `
    )

    expect(clicks).toBe(1)
  })
})
