import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock electron API
global.window.electronAPI = {
  readOnlineConfig: vi.fn(() => Promise.resolve({ models: [], onlineDir: '' })),
  createIndependentWindow: vi.fn(() => Promise.resolve({ success: true, windowId: 1 })),
  closeAllWindows: vi.fn(() => Promise.resolve({ success: true })),
  getSystemTheme: vi.fn(() => Promise.resolve('dark')),
  onThemeSystemChanged: vi.fn(() => () => {}),
  onInitTab: vi.fn(() => () => {}),
  onTabDropped: vi.fn(() => () => {}),
  mergeToMainWindow: vi.fn(() => Promise.resolve(true)),
  getAllWindows: vi.fn(() => Promise.resolve([])),
  openImageDialog: vi.fn(() => Promise.resolve(null)),
  openFileDialog: vi.fn(() => Promise.resolve(null))
}

// Global stub for Element Plus components
config.global.stubs = {
  'el-dialog': {
    template: '<div class="el-dialog"><slot v-if="modelValue" /></div>',
    props: ['modelValue']
  },
  'el-form': { template: '<div class="el-form"><slot /></div>' },
  'el-form-item': {
    template: '<div class="el-form-item"><label v-if="$slots.label"><slot name="label" /></label><slot /></div>'
  },
  'el-radio-group': {
    template: '<div class="el-radio-group"><slot /></div>',
    props: ['modelValue']
  },
  'el-radio': {
    template: '<div class="el-radio"><slot /></div>',
    props: ['label', 'modelValue']
  },
  'el-icon': {
    template: '<span class="el-icon"><slot /></span>'
  }
}
