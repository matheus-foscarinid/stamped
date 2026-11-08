import { createVaporApp } from 'vue'
import App from '@/App.vue'
import { loadAccount } from '@/account/account'
import { loadStartingLanguage } from '@/i18n/useI18n'
import '@/styles/base.css'

// waits for the locale file, so nobody sees the english text flash first
const languageLoading = loadStartingLanguage()
const accountLoading = loadAccount(languageLoading)
await languageLoading
createVaporApp(App).mount('#app')
await accountLoading
