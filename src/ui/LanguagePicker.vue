<template>
  <div ref="menuRoot" class="menu-button">
    <button
      ref="menuTrigger"
      type="button"
      class="menu-trigger control-surface press-feedback"
      :aria-label="`${t('language.label')}: ${getLanguageName(language)}`"
      :aria-expanded="isOpen"
      aria-controls="language-menu"
      @click="toggle"
    >
      <span class="language-code">{{ language }}</span>
    </button>
    <div
      v-show="isOpen"
      id="language-menu"
      class="menu-panel control-surface"
      data-placement="below"
      data-align="end"
    >
      <button
        v-for="choice in LANGUAGES"
        :key="choice"
        type="button"
        class="menu-item"
        :lang="choice"
        :aria-pressed="choice === language"
        @click="pickLanguage(choice)"
      >
        {{ getLanguageName(choice) }}
      </button>
    </div>
  </div>
</template>

<script setup vapor lang="ts">
import { useTemplateRef } from 'vue'
import { getLanguageName, LANGUAGES, type Language } from '@/i18n/languages'
import { useI18n } from '@/i18n/useI18n'
import { useDismissibleMenu } from './useDismissibleMenu'

const { language, t, setLanguage } = useI18n()

const menuRoot = useTemplateRef<HTMLElement>('menuRoot')
const menuTrigger = useTemplateRef<HTMLButtonElement>('menuTrigger')
const { isOpen, toggle, close } = useDismissibleMenu({ root: menuRoot, trigger: menuTrigger })

const pickLanguage = (choice: Language) => {
  close()
  setLanguage(choice)
}
</script>

<style scoped>
.language-code {
  font-weight: 600;
  text-transform: uppercase;
}
</style>
