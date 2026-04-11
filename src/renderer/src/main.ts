import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import './styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(ElementPlus)

app.mount('#app')

// Expose stores to window for E2E testing
// @ts-ignore - DEV environment
if (import.meta.env?.DEV) {
  // Import and call stores after Pinia is set up
  import('./stores/tabs').then(({ useTabsStore }) => {
    // @ts-ignore - Expose stores for testing
    window.$stores = {
      useTabsStore,
      usePanelStore: null
    }
  })
  import('./stores/panel').then(({ usePanelStore }) => {
    // @ts-ignore - Expose stores for testing
    if (window.$stores) {
      window.$stores.usePanelStore = usePanelStore
    }
  })
}
