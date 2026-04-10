export interface AIModel {
  id: string
  name: string
  url: string
  icon: string
  script?: string
}

export type AIModelConfig = Omit<AIModel, 'id'>
