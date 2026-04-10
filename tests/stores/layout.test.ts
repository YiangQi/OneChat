import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useLayoutStore } from '@/stores/layout'

describe('layoutStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // 创建一个 mock container
    document.body.innerHTML = '<div id="layout-container"></div>'
  })

  it('should initialize in empty state', () => {
    const store = useLayoutStore()
    expect(store.isInitialized).toBe(false)
    expect(store.goldenLayout).toBe(null)
  })

  it('should initialize layout when container provided', () => {
    const store = useLayoutStore()
    const container = document.getElementById('layout-container') as HTMLElement

    store.initLayout(container)

    // 等待异步初始化
    return new Promise(resolve => {
      setTimeout(() => {
        expect(store.containerElement).toBe(container)
        resolve(true)
      }, 100)
    })
  })

  it('should destroy layout', () => {
    const store = useLayoutStore()
    const container = document.getElementById('layout-container') as HTMLElement

    store.initLayout(container)

    setTimeout(() => {
      store.destroyLayout()
      expect(store.isInitialized).toBe(false)
      expect(store.goldenLayout).toBe(null)
    }, 100)
  })
})
