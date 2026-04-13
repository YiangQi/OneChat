import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useConversationsStore } from '@/stores/conversations'

describe('conversations store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('normalizes lists and filters malformed items', () => {
    const store = useConversationsStore()

    store.setConversations('model-1', [
      { id: ' c1 ', title: ' First ', subTitle: ' Today ', metadata: { source: 'api' } },
      { id: '', title: 'missing id' },
      { id: 'c2', title: '' },
      { id: 'c1', title: 'duplicate' },
      null
    ])

    expect(store.byModelId['model-1'].conversations).toEqual([
      {
        id: 'c1',
        title: 'First',
        subTitle: 'Today',
        metadata: { source: 'api' }
      }
    ])
  })

  it('sets active conversations, ignores unknown ids, and clears state', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const store = useConversationsStore()

    store.setConversations('model-1', [{ id: 'c1', title: 'First' }])
    store.setActiveConversation('model-1', 'c1')
    expect(store.byModelId['model-1'].activeConversationId).toBe('c1')

    store.setActiveConversation('model-1', 'missing')
    expect(store.byModelId['model-1'].activeConversationId).toBe('c1')
    expect(warn).toHaveBeenCalled()

    store.setActiveConversation('model-1', '')
    expect(store.byModelId['model-1'].activeConversationId).toBe('')

    store.clearModel('model-1')
    expect(store.byModelId['model-1']).toBeUndefined()
  })
})
