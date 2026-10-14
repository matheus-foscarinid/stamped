<template>
  <section class="map-page">
    <canvas ref="canvas" class="map-page-canvas" aria-hidden="true" />
    <dl class="map-page-stats">
      <div v-for="row in statRows" :key="row.key" class="map-page-stat">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup vapor lang="ts">
import { computed, onMounted, useTemplateRef, watch } from 'vue'
import { COUNTRY_CODES, type CountryCode, getTravelStats } from '@/countries'
import { useI18n } from '@/i18n/useI18n'
import { drawWorldSnapshot, type ProjectionId } from '@/map'

const props = defineProps<{
  projection: ProjectionId
  visited: readonly CountryCode[]
}>()

const BORDER_WIDTH_CSS_PX = 0.5

const { language, t } = useI18n()
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const stats = computed(() => getTravelStats(props.visited, language.value))

const describeRatio = (count: number, total: number) => t('summary.count', { count, total })

const statRows = computed(() => [
  {
    key: 'countries',
    label: t('stats.countries'),
    value: describeRatio(props.visited.length, COUNTRY_CODES.length),
  },
  {
    key: 'continents',
    label: t('stats.continents'),
    value: describeRatio(stats.value.continents.length, stats.value.continentTotal),
  },
  {
    key: 'unMembers',
    label: t('stats.unMembers'),
    value: describeRatio(stats.value.unMemberCount, stats.value.unMemberTotal),
  },
  { key: 'worldShare', label: t('stats.worldShare'), value: stats.value.worldShare },
])

// drawn once per change, at the size the page gives it
const drawMap = async () => {
  const element = canvas.value
  const context = element?.getContext('2d')
  if (!element || !context || element.clientWidth === 0) return
  const pixelRatio = window.devicePixelRatio || 1
  element.width = Math.round(element.clientWidth * pixelRatio)
  element.height = Math.round(element.clientHeight * pixelRatio)
  await drawWorldSnapshot(context, {
    projection: props.projection,
    visited: props.visited,
    rect: { x: 0, y: 0, width: element.width, height: element.height },
    borderWidth: BORDER_WIDTH_CSS_PX * pixelRatio,
  })
}

onMounted(() => drawMap().catch(() => undefined))
watch(
  () => props.visited,
  () => drawMap().catch(() => undefined)
)
</script>

<style scoped>
.map-page {
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 14px;
  height: 100%;
  min-height: 0;
}

.map-page-canvas {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.map-page-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 16px;
  margin: 0;
}

.map-page-stat dt {
  opacity: 0.6;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.map-page-stat dd {
  margin: 2px 0 0;
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
</style>
