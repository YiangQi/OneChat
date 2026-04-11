<template>
  <splitpanes
    v-if="panel.direction"
    :horizontal="panel.direction === 'horizontal'"
    @resize="handleResize"
  >
    <pane
      v-for="child in panel.children"
      :key="child.id"
      :min-size="20"
      :size="child.size"
    >
      <PanelRenderer
        v-if="child.children"
        :panel="child"
      />
      <TabGroup
        v-else
        :panel="child"
      />
    </pane>
  </splitpanes>
  <TabGroup
    v-else
    :panel="panel"
  />
</template>

<script setup lang="ts">
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import TabGroup from './TabGroup.vue'
import type { Panel } from '@/stores/panel'

interface Props {
  panel: Panel
}

defineProps<Props>()

// Add name for recursive component reference
defineOptions({
  name: 'PanelRenderer'
})

function handleResize(event: any) {
  console.log('[PanelRenderer] Resize event:', event)
}
</script>
