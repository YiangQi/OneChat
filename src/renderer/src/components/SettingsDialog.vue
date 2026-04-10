<template>
  <el-dialog
    v-model="visible"
    title="设置"
    width="400px"
  >
    <el-form label-width="80px">
      <el-form-item label="主题">
        <el-radio-group v-model="themeStore.theme">
          <el-radio label="auto">跟随系统</el-radio>
          <el-radio label="dark">深色</el-radio>
          <el-radio label="light">浅色</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const visible = computed({
  get: () => themeStore.settingsVisible,
  set: (val) => themeStore.setSettingsVisible(val)
})
</script>
