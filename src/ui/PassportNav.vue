<template>
  <nav class="passport-nav">
    <button
      type="button"
      class="passport-nav-button control-surface press-feedback"
      :aria-label="t('passport.previous')"
      :disabled="spreadIndex === 0"
      @click="emit('turn', -1)"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" /></svg>
    </button>
    <span class="passport-nav-count">{{ spreadIndex + 1 }} / {{ spreadCount }}</span>
    <button
      type="button"
      class="passport-nav-button control-surface press-feedback"
      :aria-label="t('passport.next')"
      :disabled="spreadIndex === spreadCount - 1"
      @click="emit('turn', 1)"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" /></svg>
    </button>
  </nav>
</template>

<script setup vapor lang="ts">
import { useI18n } from '@/i18n/useI18n'

defineProps<{ spreadIndex: number; spreadCount: number }>()

const emit = defineEmits<{ turn: [step: number] }>()

const { t } = useI18n()
</script>

<style scoped>
.passport-nav {
  display: flex;
  gap: 12px;
  align-items: center;
}

.passport-nav-button {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  cursor: pointer;
}

.passport-nav-button:disabled {
  opacity: 0.4;
  cursor: default;
}

.passport-nav-button svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.passport-nav-count {
  min-width: 48px;
  color: var(--text-muted);
  text-align: center;
  font-variant-numeric: tabular-nums;
}
</style>
