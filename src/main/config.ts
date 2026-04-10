import { readFile, access, constants } from 'fs/promises'
import { join } from 'path'
import { app } from 'electron'
import type { AIModel, AIModelConfig, OnlineConfigResult } from '../shared/types'

function getOnlineConfigPath() {
  return join(app.getPath('userData'), 'online.json')
}

function getRepoConfigPath() {
  return join(app.isPackaged ? app.getAppPath() : process.cwd(), 'online', 'online.json')
}

/**
 * Reads the online AI models configuration from online.json
 * First tries to read from userData directory, then falls back to the repo's online/ directory
 *
 * @returns Promise<OnlineConfigResult> Object containing models array and online directory path
 * @throws {Error} When JSON parsing fails or file is found but contains invalid JSON
 */
export async function readOnlineConfig(): Promise<OnlineConfigResult> {
  // Try userData first, then fall back to repo directory
  const configPath = await getConfigPath()

  if (!configPath) {
    console.warn('online.json not found in userData or repo directory')
    return {
      models: [],
      onlineDir: getOnlineDirectoryPath()
    }
  }

  try {
    const content = await readFile(configPath, 'utf-8')
    const configs: AIModelConfig[] = JSON.parse(content)

    const models = configs.map((config, index) => ({
      id: `model-${index}`,
      ...config
    }))

    return {
      models,
      onlineDir: getOnlineDirectoryPath()
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse online.json: Invalid JSON format in ${configPath}`)
    }
    throw error
  }
}

/**
 * Gets the path to the online.json configuration file
 * Checks userData first, then falls back to the repo directory
 *
 * @returns Promise<string | null> Path to the config file or null if not found
 */
async function getConfigPath(): Promise<string | null> {
  // Check userData first
  try {
    await access(getOnlineConfigPath(), constants.R_OK)
    return getOnlineConfigPath()
  } catch {
    // Fall back to repo directory
    try {
      await access(getRepoConfigPath(), constants.R_OK)
      return getRepoConfigPath()
    } catch {
      return null
    }
  }
}

/**
 * Gets the primary online.json configuration path in userData directory
 *
 * @returns string Path to the userData online.json file
 */
export function getOnlineConfigPathExport(): string {
  return getOnlineConfigPath()
}

/**
 * Gets the directory path where online resources (icons, scripts) are located
 * This returns the repo's online/ directory path for the renderer to load resources
 *
 * @returns string Path to the online resources directory
 */
export function getOnlineDirectoryPath(): string {
  // In production (packaged app), use app.getAppPath() to get the app's resource directory
  // In development, process.cwd() works correctly
  const basePath = app.isPackaged ? app.getAppPath() : process.cwd()
  return join(basePath, 'online')
}
