import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAIModelsStore } from '@/stores/aiModels'
import * as fixtures from '../../fixtures/ai-models'

describe('AI Models Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should load models from config', async () => {
    vi.mocked(window.electronAPI.readOnlineConfig).mockResolvedValue({
      models: fixtures.mockAIModels,
      onlineDir: '/path/to/online'
    })
    const store = useAIModelsStore()
    await store.loadModels()
    expect(store.models).toHaveLength(3)
    expect(store.models[0].name).toBe('ChatGPT')
  })

  it('should handle loading error', async () => {
    vi.mocked(window.electronAPI.readOnlineConfig).mockRejectedValue(new Error('Failed to read'))
    const store = useAIModelsStore()
    try {
      await store.loadModels()
    } catch (e) {
      expect(e).toBeInstanceOf(Error)
    }
  })

  it('should get model by id', async () => {
    vi.mocked(window.electronAPI.readOnlineConfig).mockResolvedValue({
      models: fixtures.mockAIModels,
      onlineDir: '/path/to/online'
    })
    const store = useAIModelsStore()
    await store.loadModels()
    const model = store.getModelById('model-0')
    expect(model?.name).toBe('ChatGPT')
  })

  it('should return undefined for non-existent model', async () => {
    vi.mocked(window.electronAPI.readOnlineConfig).mockResolvedValue({
      models: fixtures.mockAIModels,
      onlineDir: '/path/to/online'
    })
    const store = useAIModelsStore()
    await store.loadModels()
    const model = store.getModelById('non-existent')
    expect(model).toBeUndefined()
  })
})
