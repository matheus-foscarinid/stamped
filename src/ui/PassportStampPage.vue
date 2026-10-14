<template>
  <section class="stamp-page">
    <template v-if="page">
      <h2 class="stamp-page-heading">
        {{ t(`continent.${page.continent}`) }}
        <span class="stamp-page-count">
          {{ t('summary.count', { count: page.visitedCount, total: page.total }) }}
        </span>
      </h2>
      <ul class="stamp-page-grid">
        <li v-for="code in page.codes" :key="code" class="stamp-page-slot">
          <PassportStamp :code="code" />
        </li>
      </ul>
    </template>
    <p v-else class="stamp-page-empty">
      <span class="stamp-page-ghost" aria-hidden="true" />
      {{ t('passport.empty') }}
    </p>
  </section>
</template>

<script setup vapor lang="ts">
import { useI18n } from '@/i18n/useI18n'
import type { StampPage } from '@/passport/pages'
import PassportStamp from './PassportStamp.vue'

defineProps<{ page: StampPage | null }>()

const { t } = useI18n()
</script>

<style scoped>
.stamp-page {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.stamp-page-heading {
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stamp-page-count {
  opacity: 0.6;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
  font-variant-numeric: tabular-nums;
}

.stamp-page-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: 6px 14px;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* the stamp fills its slot and keeps its square drawing centred inside */
.stamp-page-slot {
  position: relative;
  min-height: 0;
}

.stamp-page-slot > * {
  position: absolute;
  inset: 0;
}

.stamp-page-empty {
  display: grid;
  grid-row: 1 / -1;
  gap: 18px;
  place-content: center;
  justify-items: center;
  max-width: 240px;
  margin: 0 auto;
  opacity: 0.7;
  text-align: center;
}

.stamp-page-ghost {
  width: 96px;
  aspect-ratio: 1;
  border: 2px dashed currentColor;
  border-radius: 50%;
  opacity: 0.5;
}
</style>
