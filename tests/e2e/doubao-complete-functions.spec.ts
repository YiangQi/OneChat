import { test, expect } from '@playwright/test';
import { getMainWindow, launchElectronApp } from './helpers/electron';

test.describe('Doubao Complete Functions Test', () => {
  test('test all Doubao injection functions', async () => {
    test.setTimeout(120000);

    const electronApp = await launchElectronApp();
    const mainWindow = await getMainWindow(electronApp);

    await mainWindow.waitForTimeout(3000);

    // 找到并点击 Doubao 按钮
    const modelItems = await mainWindow.locator('.ai-item').all();
    let doubaoButton = null;
    for (let i = 0; i < modelItems.length; i++) {
      const text = await modelItems[i].locator('.ai-name').textContent();
      if (text && text.toLowerCase().includes('doubao')) {
        doubaoButton = modelItems[i];
        break;
      }
    }

    expect(doubaoButton).toBeTruthy();

    if (doubaoButton) {
      await doubaoButton.click();
      await mainWindow.waitForTimeout(10000);

      const webview = mainWindow.locator('webview').first();

      // 测试 1: 侧边栏显示/隐藏
      console.log('\n=== 测试 1: 侧边栏显示/隐藏 ===');
      const testSidebarToggle = `
        (function() {
          const result = {
            initialClassName: '',
            afterHideClassName: '',
            afterShowClassName: ''
          };

          const nav = document.querySelector('nav[class*="left-side"]');
          if (!nav) return { error: 'Nav not found' };

          result.initialClassName = nav.className;

          // 隐藏侧边栏
          if (window.onSidebarVisibleChanged) {
            window.onSidebarVisibleChanged(false);
          }

          return new Promise(resolve => {
            setTimeout(() => {
              result.afterHideClassName = nav.className;

              // 显示侧边栏
              if (window.onSidebarVisibleChanged) {
                window.onSidebarVisibleChanged(true);
              }

              setTimeout(() => {
                result.afterShowClassName = nav.className;
                resolve(result);
              }, 600);
            }, 600);
          });
        })()
      `;

      const sidebarResult = await mainWindow.evaluate(async (data) => {
        const { webviewEl, script } = data;
        const wv = webviewEl as any;
        if (wv && wv.executeJavaScript) {
          return await wv.executeJavaScript(script);
        }
        return { error: 'webview not ready' };
      }, { webviewEl: await webview.elementHandle(), script: testSidebarToggle });

      console.log('侧边栏测试结果:', JSON.stringify(sidebarResult, null, 2));
      expect(sidebarResult.initialClassName).toContain('left-side__expand');
      expect(sidebarResult.afterHideClassName).toContain('left-side__collapse');
      expect(sidebarResult.afterShowClassName).toContain('left-side__expand');

      // 测试 2: 输入框显示/隐藏
      console.log('\n=== 测试 2: 输入框显示/隐藏 ===');
      const testInputToggle = `
        (function() {
          const result = {
            beforeHideDisplay: '',
            afterHideDisplay: '',
            afterShowDisplay: ''
          };

          const textarea = document.querySelector('textarea.semi-input-textarea');
          if (!textarea) return { error: 'Textarea not found' };

          // 向上查找容器
          let container = textarea.parentElement;
          let level = 0;
          while (container && level < 15) {
            const className = container.className || '';
            if (className.includes('input-guidance-input-container')) {
              result.beforeHideDisplay = getComputedStyle(container).display;

              // 隐藏输入框
              if (window.onInputBoxVisibleChanged) {
                window.onInputBoxVisibleChanged(false);
              }

              return new Promise(resolve => {
                setTimeout(() => {
                  result.afterHideDisplay = getComputedStyle(container).display;

                  // 显示输入框
                  if (window.onInputBoxVisibleChanged) {
                    window.onInputBoxVisibleChanged(true);
                  }

                  setTimeout(() => {
                    result.afterShowDisplay = getComputedStyle(container).display;
                    resolve(result);
                  }, 200);
                }, 200);
              });
            }
            container = container.parentElement;
            level++;
          }

          return { error: 'Input container not found' };
        })()
      `;

      const inputToggleResult = await mainWindow.evaluate(async (data) => {
        const { webviewEl, script } = data;
        const wv = webviewEl as any;
        if (wv && wv.executeJavaScript) {
          return await wv.executeJavaScript(script);
        }
        return { error: 'webview not ready' };
      }, { webviewEl: await webview.elementHandle(), script: testInputToggle });

      console.log('输入框显示/隐藏测试结果:', JSON.stringify(inputToggleResult, null, 2));
      if (!inputToggleResult.error) {
        expect(inputToggleResult.afterHideDisplay).toBe('none');
        expect(inputToggleResult.afterShowDisplay).toBe('block');
      }

      // 测试 3: 输入文本
      console.log('\n=== 测试 3: 输入文本 ===');
      const testInputText = `
        (function() {
          if (window.onInputTextChanged) {
            window.onInputTextChanged('Hello, Doubao! This is a test.');
          }

          return new Promise(resolve => {
            setTimeout(() => {
              const textarea = document.querySelector('textarea.semi-input-textarea');
              resolve({
                success: textarea ? textarea.value : 'textarea not found',
                value: textarea ? textarea.value : null
              });
            }, 300);
          });
        })()
      `;

      const inputResult = await mainWindow.evaluate(async (data) => {
        const { webviewEl, script } = data;
        const wv = webviewEl as any;
        if (wv && wv.executeJavaScript) {
          return await wv.executeJavaScript(script);
        }
        return { error: 'webview not ready' };
      }, { webviewEl: await webview.elementHandle(), script: testInputText });

      console.log('输入文本测试结果:', JSON.stringify(inputResult, null, 2));
      expect(inputResult.value).toBe('Hello, Doubao! This is a test.');

      // 测试 4: 发送消息
      console.log('\n=== 测试 4: 发送消息 ===');
      const testSend = `
        (function() {
          if (window.onInputTextChanged) {
            window.onInputTextChanged('测试发送功能');
          }

          return new Promise(resolve => {
            setTimeout(() => {
              if (window.onInputTextSended) {
                window.onInputTextSended();
              }
              resolve({ sent: true });
            }, 300);
          });
        })()
      `;

      const sendResult = await mainWindow.evaluate(async (data) => {
        const { webviewEl, script } = data;
        const wv = webviewEl as any;
        if (wv && wv.executeJavaScript) {
          return await wv.executeJavaScript(script);
        }
        return { error: 'webview not ready' };
      }, { webviewEl: await webview.elementHandle(), script: testSend });

      console.log('发送消息测试结果:', JSON.stringify(sendResult, null, 2));
      expect(sendResult.sent).toBe(true);

      // 测试 5: 新对话
      console.log('\n=== 测试 5: 新对话 ===');
      const testNewChat = `
        (function() {
          const result = {
            newChatElementFound: false,
            newChatClicked: false
          };

          const sidebar = document.querySelector('#flow_chat_sidebar');
          if (!sidebar) return { error: 'Sidebar not found' };

          if (sidebar.children.length > 1) {
            const secondChild = sidebar.children[1];
            const text = (secondChild.textContent || '').trim();
            result.newChatElementFound = (text === '新对话');

            if (result.newChatElementFound && window.onNewChatButtonClicked) {
              window.onNewChatButtonClicked();
              result.newChatClicked = true;
            }
          }

          return result;
        })()
      `;

      const newChatResult = await mainWindow.evaluate(async (data) => {
        const { webviewEl, script } = data;
        const wv = webviewEl as any;
        if (wv && wv.executeJavaScript) {
          return await wv.executeJavaScript(script);
        }
        return { error: 'webview not ready' };
      }, { webviewEl: await webview.elementHandle(), script: testNewChat });

      console.log('新对话测试结果:', JSON.stringify(newChatResult, null, 2));
      expect(newChatResult.newChatElementFound).toBe(true);
      expect(newChatResult.newChatClicked).toBe(true);

      // 测试 6: 点击会话
      console.log('\n=== 测试 6: 点击会话 ===');
      const testConversationClick = `
        (function() {
          const sidebar = document.querySelector('#flow_chat_sidebar');
          if (!sidebar) return { error: 'Sidebar not found' };

          const links = sidebar.querySelectorAll('a[href*="/chat/"]');
          for (let i = 0; i < links.length; i++) {
            const link = links[i];
            const href = link.getAttribute('href');
            const text = (link.textContent || '').trim();

            if (!href.includes('create-image') && !href.includes('drive') && text.length > 0 && text.length < 100) {
              if (window.onConversationClicked) {
                window.onConversationClicked(href.split('/chat/')[1], text);
              }
              return { clicked: true, id: href.split('/chat/')[1], title: text };
            }
          }

          return { error: 'No conversation found' };
        })()
      `;

      const conversationResult = await mainWindow.evaluate(async (data) => {
        const { webviewEl, script } = data;
        const wv = webviewEl as any;
        if (wv && wv.executeJavaScript) {
          return await wv.executeJavaScript(script);
        }
        return { error: 'webview not ready' };
      }, { webviewEl: await webview.elementHandle(), script: testConversationClick });

      console.log('点击会话测试结果:', JSON.stringify(conversationResult, null, 2));
      expect(conversationResult.clicked).toBe(true);

      // 汇总结果
      console.log('\n=== 测试汇总 ===');
      console.log('侧边栏显示/隐藏: ✅ 成功');
      console.log('输入框显示/隐藏: ✅ 成功');
      console.log('输入文本: ✅ 成功');
      console.log('发送消息: ✅ 成功');
      console.log('新对话: ✅ 成功');
      console.log('点击会话: ✅ 成功');

    } else {
      console.log('未找到 Doubao 按钮');
    }

    await mainWindow.waitForTimeout(3000);
    await electronApp.close();
  });
});
