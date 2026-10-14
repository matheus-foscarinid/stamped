<template>
  <div ref="root" class="menu-button">
    <button
      ref="trigger"
      type="button"
      class="menu-trigger control-surface press-feedback"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      @click="toggle"
    >
      <slot name="trigger" />
      <svg class="menu-chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" /></svg>
    </button>
    <div v-show="isOpen" :id="panelId" class="menu-panel control-surface" :data-placement="placement" :data-align="align">
      <slot :close="close" />
    </div>
  </div>
</template>

<script setup vapor lang="ts">
import { useId, useTemplateRef } from 'vue'
import { useDismissibleMenu } from './useDismissibleMenu'

const { placement = 'below', align = 'start' } = defineProps<{
  placement?: 'above' | 'below'
  align?: 'start' | 'end'
}>()

const root = useTemplateRef<HTMLElement>('root')
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const panelId = useId()
const { isOpen, toggle, close } = useDismissibleMenu({ root, trigger })
</script>

<style scoped>
.menu-button {
  position: relative;
}

.menu-trigger {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 11px 16px 11px 18px;
  border-radius: var(--radius-control);
  cursor: pointer;
}

.menu-trigger:hover {
  background: var(--glass-hover);
}

.menu-chevron {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: rotate var(--motion-base) var(--ease-out);
}

.menu-trigger[aria-expanded='true'] .menu-chevron {
  rotate: 180deg;
}

.menu-panel {
  position: absolute;
  z-index: 2;
  display: grid;
  min-width: 220px;
  padding: 6px;
  border-radius: var(--radius-menu);
  transition:
    opacity var(--motion-fast) var(--ease-out),
    transform var(--motion-base) var(--ease-out);
}

.menu-panel[data-placement='below'] {
  top: calc(100% + 8px);
  transform-origin: top;
}

.menu-panel[data-placement='above'] {
  bottom: calc(100% + 8px);
  transform-origin: bottom;
}

.menu-panel[data-align='start'] {
  left: 0;
}

.menu-panel[data-align='end'] {
  right: 0;
}

@starting-style {
  .menu-panel {
    opacity: 0;
    transform: scale(0.97);
  }
}
</style>
