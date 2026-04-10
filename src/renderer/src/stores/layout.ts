import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  const goldenLayout = ref<any>(null)
  const isFirstOpen = ref(true)

  function initLayout() {
    // Will be initialized in TabContainer component
  }

  function createComponent(model: any) {
    if (!goldenLayout.value) return
    goldenLayout.value.createComponentAtRoot(model)
  }

  function handleDrop() {
    // Will be implemented with Golden Layout drag handling
  }

  return {
    goldenLayout,
    isFirstOpen,
    initLayout,
    createComponent,
    handleDrop
  }
})
