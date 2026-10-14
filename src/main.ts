import { createVaporApp } from 'vue'
import App from '@/App.vue'
import { loadStartingLanguage } from '@/i18n/useI18n'
import '@/styles/base.css'

// waits for the locale file, so nobody sees the english text flash first
loadStartingLanguage().then(() => createVaporApp(App).mount('#app'))
