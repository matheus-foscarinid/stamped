<template>
  <dialog ref="dialog" class="app-dialog control-surface" :aria-labelledby="titleId" @close="emitClose">
    <form method="dialog">
      <slot name="lead" />
      <h2 :id="titleId" class="app-dialog-title">{{ title }}</h2>
      <slot />
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
  // unique per page, it names the title for screen readers
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
    // escape keeps the last answer, so a past confirm would repeat on the next escape
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
  width: min(380px, calc(100% - 32px));
  padding: 22px;
  border-radius: var(--radius-menu);
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

.app-dialog-title {
  margin: 0 0 6px;
  font-size: 17px;
  font-weight: 650;
}

.app-dialog :slotted(p) {
  margin: 0 0 20px;
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
