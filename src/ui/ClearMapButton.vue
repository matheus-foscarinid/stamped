<template>
  <div class="clear-map">
    <button
      type="button"
      class="clear-button control-surface press-feedback"
      :disabled="count === 0"
      @click="openDialog"
    >
      {{ t('clear.button') }}
    </button>
    <dialog
      ref="dialog"
      class="clear-dialog control-surface"
      aria-labelledby="clear-dialog-title"
      @close="clearIfConfirmed"
    >
      <form method="dialog">
        <h2 id="clear-dialog-title" class="clear-dialog-title">{{ t('clear.title') }}</h2>
        <p class="clear-dialog-text">{{ t('clear.text', { count }) }}</p>
        <div class="clear-dialog-actions">
          <button type="submit" class="dialog-button" value="cancel" autofocus>
            {{ t('clear.cancel') }}
          </button>
          <button type="submit" class="dialog-button dialog-button-confirm" :value="CONFIRM_VALUE">
            {{ t('clear.confirm') }}
          </button>
        </div>
      </form>
    </dialog>
  </div>
</template>

<script setup vapor lang="ts">
import { useTemplateRef } from 'vue'
import { useI18n } from '@/i18n/useI18n'

defineProps<{ count: number }>()

const emit = defineEmits<{ clear: [] }>()

const CONFIRM_VALUE = 'clear'

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const { t } = useI18n()

const openDialog = () => {
  if (!dialog.value) return
  // escape keeps the last answer, so a past confirm would clear on the next escape
  dialog.value.returnValue = ''
  dialog.value.showModal()
}

const clearIfConfirmed = () => {
  if (dialog.value?.returnValue === CONFIRM_VALUE) emit('clear')
}
</script>

<style scoped>
.clear-button {
  padding: var(--button-padding);
  border-radius: var(--radius-control);
  cursor: pointer;
}

.clear-button:hover:enabled {
  background: var(--glass-hover);
}

.clear-button:disabled {
  color: var(--text-muted);
  cursor: default;
}

.clear-dialog {
  width: min(360px, calc(100% - 32px));
  padding: 22px;
  border-radius: var(--radius-menu);
  transition:
    opacity var(--motion-fast) var(--ease-out),
    scale var(--motion-base) var(--ease-out);
}

.clear-dialog::backdrop {
  background: rgb(0 0 0 / 0.28);
}

@starting-style {
  .clear-dialog[open] {
    opacity: 0;
    scale: 0.97;
  }
}

.clear-dialog-title {
  margin: 0 0 6px;
  font-size: 17px;
  font-weight: 650;
}

.clear-dialog-text {
  margin: 0 0 20px;
  color: var(--text-muted);
}

.clear-dialog-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.dialog-button {
  padding: 10px 16px;
  border: 0;
  border-radius: var(--radius-control);
  background: var(--control-hover-bg);
  cursor: pointer;
}

.dialog-button-confirm {
  background: var(--control-active-bg);
  color: var(--control-active-text);
  font-weight: 550;
}
</style>
