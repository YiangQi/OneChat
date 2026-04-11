import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import './styles/main.css'
import { useTabsStore } from './stores/tabs'
import { usePanelStore } from './stores/panel'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(ElementPlus)

app.mount('#app')

// Expose stores to window for E2E testing (after app is mounted)
// @ts-ignore - Expose store instances for testing
window.$stores = {
  get tabsStore() { return useTabsStore() },
  get panelStore() { return usePanelStore() }
}
console.log('[E2E] Stores exposed to window.$stores')
