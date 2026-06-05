import { readFileSync } from 'fs'
import { join } from 'path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createCallBridgeBootstrapScript,
  createCallBridgeDispatchScript,
  createReadInvokedEventsScript,
  createScriptInjectionScript,
  loadCommonInjectScript,
  loadProviderInjectScript
} from '@/utils/webviewInjection'
import type { AIModel } from '@shared/types'

function runScript(script: string) {
  return (0, eval)(script)
}

describe('webviewInjection utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    delete (window as any).CallBridge
    delete (window as any).__ONECHAT_INJECTION__
    delete (window as any).__testInputText
    delete (window as any).__testThrowCount
  })

  it('loads common and provider scripts through online protocol', async () => {
    vi.mocked(window.electronAPI.readOnlineScript).mockImplementation(async (path: string) => `// ${path}`)

    const model: AIModel = {
      id: 'chatgpt',
      name: 'ChatGPT',
      url: 'https://chat.openai.com',
      icon: 'chatgpt.png',
      script: 'openai_chatgpt/inject.js'
    }

    await expect(loadCommonInjectScript()).resolves.toContain('common_inject.js')
    await expect(loadProviderInjectScript(model)).resolves.toContain('openai_chatgpt/inject.js')
  })

  it('safely returns null for missing or failed scripts', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(window.electronAPI.readOnlineScript).mockResolvedValue(null)

    await expect(loadProviderInjectScript({ id: 'x', name: 'X', url: 'https://x.test', icon: 'x.png' })).resolves.toBeNull()
    await expect(loadCommonInjectScript()).resolves.toBeNull()
    expect(warn).toHaveBeenCalled()
  })

  it('creates CallBridge with listener isolation and invoke queue', () => {
    runScript(createCallBridgeBootstrapScript())

    const handled = vi.fn()
    const throwing = vi.fn(() => {
      throw new Error('boom')
    })

    ;(window as any).CallBridge.addEventListener('inputTextChanged', throwing)
    ;(window as any).CallBridge.addEventListener('inputTextChanged', handled)
    ;(window as any).CallBridge.dispatchEvent('inputTextChanged', 'hello')
    ;(window as any).CallBridge.dispatchEvent('missingEvent')
    ;(window as any).CallBridge.invoke('webConversationChanged', 'abc')

    expect(throwing).toHaveBeenCalledWith('hello')
    expect(handled).toHaveBeenCalledWith('hello')
    expect(runScript(createReadInvokedEventsScript(true))).toMatchObject([
      { name: 'webConversationChanged', args: ['abc'] }
    ])
  })

  it('injects provider before common so common can register provider handlers', () => {
    runScript(createCallBridgeBootstrapScript())
    runScript(createScriptInjectionScript('provider', 'function onInputTextChanged(text) { window.__testInputText = text; }', 'provider.js'))

    const commonScript = readFileSync(join(process.cwd(), 'online', 'common_inject.js'), 'utf-8')
    runScript(createScriptInjectionScript('common', commonScript, 'common_inject.js'))
    runScript(createCallBridgeDispatchScript('inputTextChanged', ['hello']))

    expect((window as any).__testInputText).toBe('hello')
  })

  it('guards provider and common against duplicate injection', () => {
    runScript(createCallBridgeBootstrapScript())
    runScript(createScriptInjectionScript('provider', 'window.__testThrowCount = (window.__testThrowCount || 0) + 1;', 'provider.js'))
    runScript(createScriptInjectionScript('provider', 'window.__testThrowCount = (window.__testThrowCount || 0) + 1;', 'provider.js'))

    expect((window as any).__testThrowCount).toBe(1)
  })
})
