import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  },
  server: {
    port: 5173,
    fs: {
      // 允许访问项目根目录和 online 目录
      allow: ['..', '.']
    }
  },
  publicDir: 'online'  // 将 online 目录作为静态资源目录
})
