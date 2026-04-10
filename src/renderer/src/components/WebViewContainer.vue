<template>
  <div class="webview-container">
    <webview
      :src="model.url"
      :partition="`persist:${model.id}`"
      class="webview"
    ></webview>
  </div>
</template>

<script setup lang="ts">
import type { AIModel } from '@shared/types'

defineProps<{
  model: AIModel
}>()
</script>

<style scoped>
.webview-container {
  flex: 1;
  height: 100%;
}

.webview {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
