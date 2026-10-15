<template>
  <button
    type="button"
    class="wishlist-mode press-feedback"
    :aria-pressed="isPressed"
    :aria-label="t('search.wishlistMode')"
    :title="t('search.wishlistMode')"
    @click="emit('toggle')"
  >
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z" />
    </svg>
  </button>
</template>

<script setup vapor lang="ts">
import { useI18n } from '@/i18n/useI18n'

defineProps<{ isPressed: boolean }>()

const emit = defineEmits<{ toggle: [] }>()

const { t } = useI18n()
</script>

<style scoped>
.wishlist-mode {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    background-color var(--motion-fast) var(--ease-out),
    color var(--motion-fast) var(--ease-out);
}

.wishlist-mode:hover {
  background: var(--control-hover-bg);
  color: var(--text);
}

.wishlist-mode[aria-pressed="true"] {
  background: var(--map-wishlist-soft);
  color: var(--map-wishlist);
}

.wishlist-mode svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linejoin: round;
}

.wishlist-mode[aria-pressed="true"] svg {
  fill: currentColor;
}
</style>
