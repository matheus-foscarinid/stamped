<template>
  <div class="clear-map">
    <button
      type="button"
      class="clear-button icon-label-button control-surface press-feedback"
      :disabled="count === 0"
      @click="isDialogOpen = true"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2.5 4.5h11M6 4.5V3a1 1 0 011-1h2a1 1 0 011 1v1.5M4 4.5l.7 8.6a1 1 0 001 .9h4.6a1 1 0 001-.9l.7-8.6" />
      </svg>
      <span>{{ t('clear.button') }}</span>
    </button>
    <AppDialog
      name="clear"
      :is-open="isDialogOpen"
      :title="t('clear.title')"
      :actions="actions"
      @close="clearIfConfirmed"
    >
      <p>{{ t('clear.text', { count }) }}</p>
    </AppDialog>
  </div>
</template>

<script setup vapor lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '@/i18n/useI18n'
import AppDialog from './AppDialog.vue'

defineProps<{ count: number }>()

const emit = defineEmits<{ clear: [] }>()

const CONFIRM_VALUE = 'clear'

const { t } = useI18n()
const isDialogOpen = ref(false)
const actions = computed(() => [
  { value: 'cancel', label: t('clear.cancel') },
  { value: CONFIRM_VALUE, label: t('clear.confirm'), isPrimary: true },
])

const clearIfConfirmed = (value: string) => {
  isDialogOpen.value = false
  if (value === CONFIRM_VALUE) emit('clear')
}
</script>

<style scoped>
.clear-button:hover:enabled {
  background: var(--glass-hover);
}

.clear-button:disabled {
  color: var(--text-muted);
  cursor: default;
}
</style>
