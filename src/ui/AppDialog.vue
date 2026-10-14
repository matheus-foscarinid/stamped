<template>
  <dialog ref="dialog" class="app-dialog control-surface" :aria-labelledby="titleId" @close="emitClose">
    <form method="dialog">
      <div class="app-dialog-heading">
        <slot name="lead" />
        <h2 :id="titleId" class="app-dialog-title">{{ title }}</h2>
      </div>
      <div class="app-dialog-body">
        <slot />
      </div>
      <div class="app-dialog-actions">
        <button
          v-for="(action, index) in actions"
          :key="action.value"
          type="submit"
          class="app-dialog-button"
          :data-primary="action.isPrimary"
          :value="action.value"
          :autofocus="index === 0"
        >
          {{ action.label }}
        </button>
      </div>
    </form>
  </dialog>
</template>

<script setup vapor lang="ts">
import { computed, useTemplateRef, watch } from 'vue'

interface DialogAction {
  value: string
  label: string
  isPrimary?: boolean
}

const props = defineProps<{
  // links the title to the dialog for screen readers
  name: string
  isOpen: boolean
  title: string
  actions: DialogAction[]
}>()

const emit = defineEmits<{ close: [value: string] }>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const titleId = computed(() => `${props.name}-dialog-title`)

const syncOpen = ([isOpen, element]: readonly [boolean, HTMLDialogElement | null]) => {
  if (!element) return
  if (isOpen && !element.open) {
    // reset so escape can't replay a past confirm
    element.returnValue = ''
    element.showModal()
  }
  if (!isOpen && element.open) element.close()
}

watch(() => [props.isOpen, dialog.value] as const, syncOpen, { immediate: true })

const emitClose = () => emit('close', dialog.value?.returnValue ?? '')
</script>

<style scoped>
.app-dialog {
  width: min(440px, calc(100% - 32px));
  padding: 24px;
  border-radius: var(--radius-menu);
  /* the glass is too see-through for a block of text over the map */
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  transition:
    opacity var(--motion-fast) var(--ease-out),
    scale var(--motion-base) var(--ease-out);
}

.app-dialog::backdrop {
  background: rgb(0 0 0 / 0.28);
}

@starting-style {
  .app-dialog[open] {
    opacity: 0;
    scale: 0.97;
  }
}

.app-dialog-heading {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
}

.app-dialog-title {
  margin: 0;
  font-size: 17px;
  font-weight: 650;
}

.app-dialog-body {
  display: grid;
  gap: 14px;
  margin-bottom: 22px;
}

.app-dialog-body :slotted(p) {
  margin: 0;
  color: var(--text-muted);
}

.app-dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.app-dialog-button {
  padding: 10px 16px;
  border: 0;
  border-radius: var(--radius-control);
  background: var(--control-hover-bg);
  cursor: pointer;
}

.app-dialog-button[data-primary="true"] {
  background: var(--control-active-bg);
  color: var(--control-active-text);
  font-weight: 550;
}
</style>
