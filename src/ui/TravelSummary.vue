<template>
  <div ref="anchor" class="summary-anchor">
    <div class="summary control-surface" :data-open="isOpen">
    <h1 class="summary-heading">
      <button
        ref="toggleButton"
        type="button"
        class="summary-toggle"
        :aria-expanded="isOpen"
        aria-controls="travel-stats"
        @click="toggle"
      >
        <span class="summary-brand">
          <StampedLogo class="summary-logo" />
          <span class="summary-name">Stamped</span>
        </span>
        <span ref="countLabel" class="summary-count">
          {{ describeRatio(visited.length, COUNTRY_CODES.length) }}
        </span>
      </button>
    </h1>
    <div id="travel-stats" class="summary-details">
      <div class="summary-details-inner">
        <dl class="summary-stats">
          <div v-for="stat in statRows" :key="stat.key" class="summary-stat">
            <dt>{{ stat.label }}</dt>
            <dd>{{ stat.value }}</dd>
            <progress class="summary-bar" :value="stat.ratio" aria-hidden="true" />
          </div>
        </dl>
        <p class="summary-note">{{ continentNote }}</p>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup vapor lang="ts">
import { computed, useTemplateRef, watch } from 'vue'
import { COUNTRY_CODES, type CountryCode, getTravelStats } from '@/countries'
import { useI18n } from '@/i18n/useI18n'
import StampedLogo from './StampedLogo.vue'
import { useDismissibleMenu } from './useDismissibleMenu'

const props = defineProps<{
  visited: readonly CountryCode[]
}>()

const anchor = useTemplateRef<HTMLElement>('anchor')
const toggleButton = useTemplateRef<HTMLButtonElement>('toggleButton')
const { isOpen, toggle } = useDismissibleMenu({ root: anchor, trigger: toggleButton })
const { language, t } = useI18n()
const countLabel = useTemplateRef<HTMLElement>('countLabel')

// a new stamp lands with a small thump, so the count feels earned
const STAMP_KEYFRAMES = [{ scale: 1 }, { scale: 1.28, color: 'var(--map-visited)' }, { scale: 1 }]
watch(
  () => props.visited.length,
  (count, previousCount) => {
    if (count <= previousCount || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    countLabel.value?.animate(STAMP_KEYFRAMES, { duration: 420, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' })
  }
)

const stats = computed(() => getTravelStats(props.visited, language.value))

const describeRatio = (count: number, total: number) => t('summary.count', { count, total })

const statRows = computed(() => [
  {
    key: 'continents',
    label: t('stats.continents'),
    value: describeRatio(stats.value.continents.length, stats.value.continentTotal),
    ratio: stats.value.continents.length / stats.value.continentTotal,
  },
  {
    key: 'unMembers',
    label: t('stats.unMembers'),
    value: describeRatio(stats.value.unMemberCount, stats.value.unMemberTotal),
    ratio: stats.value.unMemberCount / stats.value.unMemberTotal,
  },
  {
    key: 'worldShare',
    label: t('stats.worldShare'),
    value: stats.value.worldShare,
    ratio: props.visited.length / COUNTRY_CODES.length,
  },
])

const continentNote = computed(() => {
  const { continents } = stats.value
  if (continents.length === 0) return t('stats.empty')
  const names = continents.map(continent => t(`continent.${continent}`))
  return new Intl.ListFormat(language.value, { type: 'conjunction' }).format(names)
})
</script>

<style scoped>
/* the anchor keeps the pill's spot in the bar, so opening the card covers what's below */
.summary-anchor {
  position: relative;
  z-index: 3;
  width: 272px;
  height: var(--control-height);
}

.summary {
  position: absolute;
  inset: 0 0 auto;
  border-radius: 22px;
}

.summary-heading {
  margin: 0;
  font: inherit;
}

.summary-brand {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  align-self: center;
}

.summary-logo {
  --logo-frame: var(--text-muted);
  --logo-globe: var(--map-visited);

  width: 24px;
  height: 24px;
  margin-block: -3px;
}

.summary-toggle {
  display: flex;
  gap: 10px;
  align-items: baseline;
  justify-content: space-between;
  width: 100%;
  padding: 11px 18px;
  border: 0;
  border-radius: 22px;
  background: transparent;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.02em;
  cursor: pointer;
}

.summary-count {
  display: inline-block;
  color: var(--text-muted);
  white-space: nowrap;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

/* rows animate from 0fr to 1fr, so the card grows to fit whatever the stats need */
.summary-details {
  display: grid;
  grid-template-rows: 0fr;
  visibility: hidden;
  transition:
    grid-template-rows var(--motion-base) var(--ease-out),
    visibility 0s linear var(--motion-base);
}

.summary[data-open="true"] .summary-details {
  grid-template-rows: 1fr;
  visibility: visible;
  transition-delay: 0s;
}

@media (hover: hover) {
  .summary:hover .summary-details {
    grid-template-rows: 1fr;
    visibility: visible;
    transition-delay: 0s;
  }
}

.summary-details-inner {
  min-height: 0;
  overflow: hidden;
}

.summary-stats {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 4px 18px 0;
}

.summary-stat {
  display: grid;
  grid-template-columns: 1fr auto;
  row-gap: 6px;
}

.summary-stat dt {
  color: var(--text-muted);
}

.summary-stat dd {
  margin: 0;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.summary-bar {
  grid-column: 1 / -1;
  width: 100%;
  height: 4px;
  overflow: hidden;
  border: 0;
  border-radius: 2px;
  background: var(--control-hover-bg);
  appearance: none;
}

.summary-bar::-webkit-progress-bar {
  background: transparent;
}

.summary-bar::-webkit-progress-value {
  background: var(--map-visited);
  transition: inline-size var(--motion-base) var(--ease-out);
}

.summary-bar::-moz-progress-bar {
  background: var(--map-visited);
}

.summary-note {
  margin: 0;
  padding: 14px 18px 16px;
  color: var(--text-muted);
  font-size: 13px;
}

/* the smallest phones keep the logo and the count. the name stays for screen readers */
@media (max-width: 380px) {
  .summary-name {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}
</style>
