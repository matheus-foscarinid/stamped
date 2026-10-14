<template>
  <section class="stamp-page">
    <div class="stamp-page-scroll">
      <p v-if="content.groups.length === 0" class="stamp-page-empty">
        <span class="stamp-page-ghost" aria-hidden="true" />
        {{ content.text.emptyText }}
      </p>
      <section v-for="group in content.groups" :key="group.continent" class="stamp-page-section">
        <h2 class="stamp-page-heading">
          {{ t(`continent.${group.continent}`) }}
          <span class="stamp-page-count">
            {{ t('summary.count', { count: group.codes.length, total: group.total }) }}
          </span>
        </h2>
        <ul class="stamp-page-grid">
          <li v-for="code in group.codes" :key="code" class="stamp-page-slot">
            <PassportStamp :code="code" />
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>

<script setup vapor lang="ts">
import type { CountryCode } from '@/countries'
import { useI18n } from '@/i18n/useI18n'
import PassportStamp from './PassportStamp.vue'
import { usePassportContent } from './usePassportContent'

const props = defineProps<{ visited: readonly CountryCode[] }>()

const { t } = useI18n()
const content = usePassportContent(() => props.visited)
</script>

<style scoped>
.stamp-page {
  display: flex;
  min-height: 0;
}

/* fade the stamps at the edge, never the paper */
.stamp-page-scroll {
  flex: 1;
  min-height: 0;
  /* tilted stamps overflow their slots */
  margin-inline: -12px;
  padding: 0 12px 28px;
  overflow: hidden auto;
  overscroll-behavior-y: contain;
  scrollbar-width: none;
  mask-image: linear-gradient(to bottom, #000 calc(100% - 36px), transparent);
}

.stamp-page-section + .stamp-page-section {
  margin-top: 22px;
}

.stamp-page-heading {
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin: 0 0 10px;
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
  grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
  gap: 10px 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.stamp-page-slot {
  aspect-ratio: 1;
}

.stamp-page-empty {
  display: grid;
  gap: 18px;
  place-content: center;
  justify-items: center;
  max-width: 240px;
  min-height: 100%;
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
