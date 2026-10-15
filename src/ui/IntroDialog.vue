<template>
  <AppDialog
    name="intro"
    :is-open="isOpen"
    :title="t('intro.title')"
    :actions="actions"
    @close="close"
  >
    <template #lead>
      <StampedLogo class="intro-logo" />
    </template>
    <p>{{ t('intro.text') }}</p>
    <ul class="intro-steps">
      <li v-for="step in STEPS" :key="step">{{ t(step) }}</li>
    </ul>
  </AppDialog>
</template>

<script setup vapor lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/i18n/useI18n'
import AppDialog from './AppDialog.vue'
import StampedLogo from './StampedLogo.vue'
import { useIntroDialog } from './useIntroDialog'

const STEPS = ['intro.mark', 'intro.explore', 'intro.wishlist', 'intro.passport', 'intro.share'] as const

const { t } = useI18n()
const { isOpen, close } = useIntroDialog()
const actions = computed(() => [{ value: 'start', label: t('intro.start'), isPrimary: true }])
</script>

<style scoped>
.intro-logo {
  --logo-frame: var(--text-muted);
  --logo-globe: var(--map-visited);

  flex: none;
  width: 34px;
  height: 34px;
}

.intro-steps {
  display: grid;
  gap: 10px;
  margin: 0;
  padding-left: 20px;
}

.intro-steps li::marker {
  color: var(--map-visited);
}
</style>
