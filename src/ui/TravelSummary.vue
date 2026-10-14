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
        <span>Stamped</span>
        <span class="summary-count">{{ visited.length }} of {{ COUNTRY_CODES.length }}</span>
      </button>
    </h1>
    <div id="travel-stats" class="summary-details">
      <div class="summary-details-inner">
        <dl class="summary-stats">
          <div v-for="stat in statRows" :key="stat.label" class="summary-stat">
            <dt>{{ stat.label }}</dt>
            <dd>{{ stat.value }}</dd>
            <span class="summary-bar" :style="{ '--ratio': stat.ratio }" aria-hidden="true" />
          </div>
        </dl>
        <p class="summary-note">{{ continentNote }}</p>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup vapor lang="ts">
import { computed, useTemplateRef } from 'vue'
import { COUNTRY_CODES, type CountryCode, getTravelStats } from '@/countries'
import { useDismissibleMenu } from './useDismissibleMenu'

const props = defineProps<{
  visited: readonly CountryCode[]
}>()

const anchor = useTemplateRef<HTMLElement>('anchor')
const toggleButton = useTemplateRef<HTMLButtonElement>('toggleButton')
const { isOpen, toggle } = useDismissibleMenu({ root: anchor, trigger: toggleButton })
const stats = computed(() => getTravelStats(props.visited))

const statRows = computed(() => [
  {
    label: 'Continents',
    value: `${stats.value.continentCount} of ${stats.value.continentTotal}`,
    ratio: stats.value.continentCount / stats.value.continentTotal,
  },
  {
    label: 'UN members',
    value: `${stats.value.unMemberCount} of ${stats.value.unMemberTotal}`,
    ratio: stats.value.unMemberCount / stats.value.unMemberTotal,
  },
  {
    label: 'Share of the world',
    value: stats.value.worldShare,
    ratio: props.visited.length / COUNTRY_CODES.length,
  },
])

const continentNote = computed(() => stats.value.continentNames || 'Mark a country to start your map')
</script>

<style scoped>
/* the anchor keeps the pill's spot in the bar, so opening the card covers what's below */
.summary-anchor {
  position: relative;
  z-index: 3;
  width: 272px;
  height: 45px;
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
  color: var(--text-muted);
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
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(var(--map-visited), var(--map-visited)) no-repeat 0 0 /
      calc(var(--ratio) * 100%) 100%,
    var(--control-hover-bg);
  transition: background-size var(--motion-base) var(--ease-out);
}

.summary-note {
  margin: 0;
  padding: 14px 18px 16px;
  color: var(--text-muted);
  font-size: 13px;
}
</style>
