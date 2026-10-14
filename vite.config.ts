import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { injectFavicon, inlineEntryAssets, preloadDefaultMap } from './build/vite-plugins.ts'

const BASE = '/'

export default defineConfig({
  base: BASE,
  plugins: [
    vue({ features: { vapor: true, optionsAPI: false, prodDevtools: false } }),
    preloadDefaultMap(BASE),
    injectFavicon(),
    inlineEntryAssets(),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    sourcemap: false,
    modulePreload: false,
  },
})
