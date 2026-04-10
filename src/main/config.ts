import { readFile } from 'fs/promises'
import { join } from 'path'
import { app } from 'electron'
import type { AIModel, AIModelConfig } from '@shared/types'

const ONLINE_CONFIG_PATH = join(app.getPath('userData'), 'online.json')

export async function readOnlineConfig(): Promise<AIModel[]> {
  try {
    const content = await readFile(ONLINE_CONFIG_PATH, 'utf-8')
    const configs: AIModelConfig[] = JSON.parse(content)

    return configs.map((config, index) => ({
      id: `model-${index}`,
      ...config
    }))
  } catch (error) {
    console.error('Failed to read online.json:', error)
    return []
  }
}

export function getOnlineConfigPath(): string {
  return ONLINE_CONFIG_PATH
}
