<template>
  <div class="gl-webview-wrapper">
    <WebViewContainer
      v-if="tabData"
      :model="tabData.model"
      :visible="true"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import WebViewContainer from './WebViewContainer.vue'
import type { Tab } from '@/stores/tabs'

const props = defineProps<{
  tabId?: string
  tabData?: Tab
}>()

// 使用 computed 获取 tabData
const tabData = computed(() => props.tabData || null)
</script>

<style scoped>
.gl-webview-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
