export interface Tab {
  id: string
  modelId: string
  model: any
  createdAt: number
  windowId?: number
}

export type TabState = 'loading' | 'loaded' | 'error'
