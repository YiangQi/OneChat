import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AIModel } from '@shared/types'

export const useAIModelsStore = defineStore('aiModels', () => {
  const models = ref<AIModel[]>([])
  const onlineDir = ref('')

  async function loadModels() {
    const result = await window.electronAPI.readOnlineConfig()
    models.value = result.models
    onlineDir.value = result.onlineDir
  }

  function getModelById(id: string) {
    return models.value.find(m => m.id === id)
  }

  return {
    models,
    onlineDir,
    loadModels,
    getModelById
  }
})
