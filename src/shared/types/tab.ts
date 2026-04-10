import type { AIModel } from './ai'

export interface Tab {
  id: string
  modelId: string
  model: AIModel
  createdAt: number
  windowId?: number
}

export type TabState = 'loading' | 'loaded' | 'error'
