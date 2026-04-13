import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getMainWindow, launchElectronApp } from './helpers/electron'

const aliyunTongyiScript = readFileSync(join(process.cwd(), 'online', 'aliyun_tongyi', 'inject.js'), 'utf-8')
const commonScript = readFileSync(join(process.cwd(), 'online', 'common_inject.js'), 'utf-8')

async function runInInjectedFrame<T>(page: Page, bodyHtml: string, action: string) {
  return page.evaluate(
    ({ bodyHtml, aliyunTongyiScript, commonScript, action }) => {
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

      frameWindow.eval(aliyunTongyiScript)
      frameWindow.eval(commonScript)
      return frameWindow.eval(action) as T
    },
    { bodyHtml, aliyunTongyiScript, commonScript, action }
  )
}

test.describe('Aliyun Tongyi injection (E2E)', () => {
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
    const result = await runInInjectedFrame<{ hidden: boolean; visibleAgain: boolean }>(
      mainWindow,
      `
        <style>
          .transform-container {
            width: 256px;
            height: 400px;
            transition: transform 0.3s;
          }
          .transform-container.-translate-x-full {
            transform: translateX(-100%);
          }
          .transform-container.translate-x-0 {
            transform: translateX(0);
          }
        </style>
        <div class="transform-container translate-x-0" id="sidebar">
          <span data-icon-type="qwpcicon-sidebarLeft" onclick="document.getElementById('sidebar').classList.remove('translate-x-0');document.getElementById('sidebar').classList.add('-translate-x-full')"></span>
          Sidebar content
        </div>
      `,
      `
        CallBridge.dispatchEvent('sidebarVisibleChanged', false);
        const hidden = document.getElementById('sidebar').classList.contains('-translate-x-full');
        CallBridge.dispatchEvent('sidebarVisibleChanged', true);
        const visibleAgain = !document.getElementById('sidebar').classList.contains('-translate-x-full');
        ({ hidden, visibleAgain });
      `
    )

    expect(result.hidden).toBe(true)
    expect(result.visibleAgain).toBe(true)
  })

  test('returns true when sidebar is already in target state', async () => {
    const result = await runInInjectedFrame<{ alreadyVisibleResult: boolean; alreadyHiddenResult: boolean }>(
      mainWindow,
      `
        <div class="transform-container translate-x-0" id="sidebar">
          <span data-icon-type="qwpcicon-sidebarLeft"></span>
          <span data-icon-type="qwpcicon-sidebarRight"></span>
        </div>
      `,
      `
        const sidebarVisibleResult = window.onSidebarVisibleChanged ? window.onSidebarVisibleChanged(true) : false;
        const sidebarHiddenResult = window.onSidebarVisibleChanged ? window.onSidebarVisibleChanged(false) : false;
        ({ alreadyVisibleResult: sidebarVisibleResult, alreadyHiddenResult: sidebarHiddenResult });
      `
    )

    expect(result.alreadyVisibleResult).toBe(true)
    expect(result.alreadyHiddenResult).toBe(true)
  })

  test('clicks the new chat button in sidebar', async () => {
    const clicks = await runInInjectedFrame<number>(
      mainWindow,
      `
        <span data-icon-type="qwpcicon-newDialogueMedium" onclick="window.__newChatClicks = (window.__newChatClicks || 0) + 1"></span>
      `,
      `
        CallBridge.dispatchEvent('chatNewButtonClicked');
        window.__newChatClicks || 0;
      `
    )

    expect(clicks).toBe(1)
  })

  test('clicks the new chat button in top bar', async () => {
    const clicks = await runInInjectedFrame<number>(
      mainWindow,
      `
        <span data-icon-type="qwpcicon-newDialogue" onclick="window.__newChatClicks = (window.__newChatClicks || 0) + 1"></span>
      `,
      `
        CallBridge.dispatchEvent('chatNewButtonClicked');
        window.__newChatClicks || 0;
      `
    )

    expect(clicks).toBe(1)
  })

  test('expands sidebar and clicks a conversation', async () => {
    const result = await runInInjectedFrame<{
      expanded: boolean
      clickedTitle: string
    }>(
      mainWindow,
      `
        <div class="transform-container -translate-x-full" id="sidebar">
          <span data-icon-type="qwpcicon-sidebarRight" onclick="document.getElementById('sidebar').classList.remove('-translate-x-full');document.getElementById('sidebar').classList.add('translate-x-0');"></span>
          <div class="conversation-list">
            <div class="conversation-item">
              <div class="cursor-pointer" onclick="window.__clickedTitle = 'First conversation'">First conversation</div>
            </div>
            <div class="conversation-item">
              <div class="cursor-pointer" onclick="window.__clickedTitle = 'Second conversation'">Second conversation</div>
            </div>
          </div>
        </div>
      `,
      `
        (async () => {
          CallBridge.dispatchEvent('conversationClicked', 'conv-1', 'First conversation');
          await new Promise(resolve => setTimeout(resolve, 700));
          return {
            expanded: !document.getElementById('sidebar').classList.contains('-translate-x-full'),
            clickedTitle: window.__clickedTitle || ''
          };
        })();
      `
    )

    expect(result.expanded).toBe(true)
    expect(result.clickedTitle).toBe('First conversation')
  })

  test('keeps generic sidebar fallback for non-Tongyi-like pages', async () => {
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
        <aside id="sidebar">history</aside>
        <button
          id="sidebar-toggle"
          onclick="document.querySelector('#sidebar').style.display = document.querySelector('#sidebar').style.display === 'none' ? 'block' : 'none';"
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
})
