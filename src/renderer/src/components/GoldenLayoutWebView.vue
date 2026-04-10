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
import { ref, onMounted } from 'vue'
import WebViewContainer from './WebViewContainer.vue'
import type { Tab } from '@/stores/tabs'

const props = defineProps<{
  container?: any
  state?: {
    tabId?: string
    tabData?: Tab
  }
}>()

const tabData = ref<Tab | null>(null)

// Golden Layout 会调用这个方法来传递状态
onMounted(() => {
  if (props.state?.tabData) {
    tabData.value = props.state.tabData
  }
})
</script>

<style scoped>
.gl-webview-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
