<template>
  <svg
    class="passport-stamp"
    viewBox="0 0 100 100"
    role="img"
    :style="{ '--stamp-hue': style.hue, '--stamp-tilt': `${style.tiltDeg}deg` }"
  >
    <title>{{ name }}</title>
    <template v-if="style.shape === 'round'">
      <circle cx="50" cy="50" r="47" stroke-width="3" />
      <circle cx="50" cy="50" r="31" stroke-width="1.2" />
    </template>
    <template v-else-if="style.shape === 'oval'">
      <ellipse cx="50" cy="50" rx="48" ry="40" stroke-width="3" />
      <ellipse cx="50" cy="50" rx="33" ry="25" stroke-width="1.2" />
    </template>
    <template v-else-if="style.shape === 'hexagon'">
      <polygon :points="HEXAGON_OUTER" stroke-width="3" stroke-linejoin="round" />
      <polygon :points="HEXAGON_INNER" stroke-width="1.2" stroke-linejoin="round" />
    </template>
    <template v-else>
      <rect x="4" y="4" width="92" height="92" rx="4" stroke-width="2.5" stroke-dasharray="4 3" />
      <rect x="12" y="12" width="76" height="76" rx="2" stroke-width="1.2" />
    </template>

    <template v-if="hasRimLabels">
      <defs>
        <path :id="`${code}-stamp-top`" :d="rimArcs.top" />
        <path :id="`${code}-stamp-bottom`" :d="rimArcs.bottom" />
      </defs>
      <text class="stamp-label" :font-size="fitLabelSize(name, RIM_WIDTH)">
        <textPath :href="`#${code}-stamp-top`" startOffset="50%">{{ name }}</textPath>
      </text>
      <text class="stamp-label" :font-size="fitLabelSize(continent, RIM_WIDTH)">
        <textPath :href="`#${code}-stamp-bottom`" startOffset="50%">{{ continent }}</textPath>
      </text>
    </template>
    <template v-else>
      <text class="stamp-label" x="50" :y="lineLabels.top" :font-size="fitLabelSize(name, lineLabels.width)">
        {{ name }}
      </text>
      <text
        class="stamp-label"
        x="50"
        :y="lineLabels.bottom"
        :font-size="fitLabelSize(continent, lineLabels.width)"
      >
        {{ continent }}
      </text>
    </template>

    <text class="stamp-flag" x="50" y="50">{{ flag }}</text>
    <text class="stamp-code" x="50" y="68">{{ code }}</text>
  </svg>
</template>

<script setup vapor lang="ts">
import { computed } from 'vue'
import { type CountryCode, getContinent, getCountryName, getFlagEmoji } from '@/countries'
import { useI18n } from '@/i18n/useI18n'
import { fitLabelSize, getStampStyle } from '@/passport/stamp-style'

const props = defineProps<{ code: CountryCode }>()

const RIM_WIDTH = 84
// straight labels sit inside the inner outline, which is narrower on a hexagon
const LINE_LABELS = {
  hexagon: { width: 44, top: 30, bottom: 79 },
  perforated: { width: 62, top: 27, bottom: 80 },
}
const HEXAGON_OUTER = '27,7 73,7 96,50 73,93 27,93 4,50'
const HEXAGON_INNER = '32,16 68,16 87,50 68,84 32,84 13,50'
// the top arc reads left to right over the top, the bottom one under it, both upright
const ROUND_ARCS = { top: 'M 14 50 A 36 36 0 0 1 86 50', bottom: 'M 6 50 A 44 44 0 0 0 94 50' }
const OVAL_ARCS = { top: 'M 13 50 A 37 29 0 0 1 87 50', bottom: 'M 6 50 A 44 36 0 0 0 94 50' }

const { language, t } = useI18n()

const style = computed(() => getStampStyle(props.code))
const name = computed(() => getCountryName(props.code, language.value))
const flag = computed(() => getFlagEmoji(props.code))
const continent = computed(() => {
  const continentId = getContinent(props.code)
  return continentId ? t(`continent.${continentId}`) : ''
})
const hasRimLabels = computed(() => style.value.shape === 'round' || style.value.shape === 'oval')
const rimArcs = computed(() => (style.value.shape === 'oval' ? OVAL_ARCS : ROUND_ARCS))
const lineLabels = computed(() =>
  style.value.shape === 'hexagon' ? LINE_LABELS.hexagon : LINE_LABELS.perforated
)
</script>

<style scoped>
.passport-stamp {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  color: hsl(var(--stamp-hue) 62% var(--stamp-lightness));
  fill: none;
  stroke: currentColor;
  opacity: 0.9;
  rotate: var(--stamp-tilt);
  mix-blend-mode: var(--stamp-blend, normal);
  transition:
    scale var(--motion-base) var(--ease-out),
    opacity var(--motion-base) var(--ease-out);
}

@starting-style {
  .passport-stamp {
    opacity: 0;
    scale: 1.3;
  }
}

.passport-stamp text {
  fill: currentColor;
  stroke: none;
  text-anchor: middle;
}

.stamp-label {
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.stamp-flag {
  font-size: 24px;
  dominant-baseline: central;
}

.stamp-code {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
</style>
