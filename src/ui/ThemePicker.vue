<template>
  <div ref="menuRoot" class="menu-button">
    <button
      ref="menuTrigger"
      type="button"
      class="menu-trigger control-surface press-feedback"
      :aria-expanded="isOpen"
      aria-controls="theme-menu"
      @click="toggle"
    >
      <span class="theme-swatch" :data-theme="swatchTheme(theme)" aria-hidden="true" />
      Theme
    </button>
    <div
      v-show="isOpen"
      id="theme-menu"
      class="menu-panel control-surface"
      data-placement="below"
      data-align="end"
    >
      <button
        v-for="choice in THEME_CHOICES"
        :key="choice"
        type="button"
        class="menu-item"
        :aria-pressed="choice === theme"
        @click="pickTheme(choice)"
      >
        <span class="theme-option">
          <span class="theme-swatch" :data-theme="swatchTheme(choice)" aria-hidden="true" />
          {{ THEME_LABELS[choice] }}
        </span>
        <span v-if="choice === 'auto'" class="menu-item-hint">Matches system</span>
      </button>
    </div>
  </div>
</template>

<script setup vapor lang="ts">
import { useTemplateRef } from 'vue'
import { THEME_CHOICES, THEME_LABELS, type ThemeChoice } from '@/theme/themes'
import { useTheme } from '@/theme/useTheme'
import { useDismissibleMenu } from './useDismissibleMenu'

const { theme, setTheme } = useTheme()

// the auto swatch is split light and dark, drawn by its own css
const swatchTheme = (choice: ThemeChoice) => (choice === 'auto' ? undefined : choice)

const menuRoot = useTemplateRef<HTMLElement>('menuRoot')
const menuTrigger = useTemplateRef<HTMLButtonElement>('menuTrigger')
const { isOpen, toggle, close } = useDismissibleMenu({ root: menuRoot, trigger: menuTrigger })

const pickTheme = (choice: ThemeChoice) => {
  setTheme(choice)
  close()
}
</script>

<style scoped>
.theme-option {
  display: inline-flex;
  gap: 10px;
  align-items: center;
}

.theme-swatch {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--page-bg) 50%, var(--map-visited) 50%);
  box-shadow:
    0 0 0 2px var(--surface),
    0 0 0 3px var(--glass-line);
}

.theme-swatch:not([data-theme]) {
  background: linear-gradient(90deg, #ffffff 50%, #000000 50%);
}

.menu-item[aria-pressed='true'] {
  background: var(--control-hover-bg);
  font-weight: 600;
}
</style>
