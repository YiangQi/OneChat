export interface AIModel {
  id: string
  name: string
  url: string
  icon: string
  script?: string
}

export type AIModelConfig = Omit<AIModel, 'id'>

/**
 * Result of reading online configuration
 */
export interface OnlineConfigResult {
  models: AIModel[]
  onlineDir: string
}
