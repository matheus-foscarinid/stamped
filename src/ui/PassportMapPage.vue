<template>
  <section class="map-page">
    <header class="map-page-header">
      <span class="map-page-brand">
        <StampedLogo class="map-page-logo" />
        {{ APP_NAME }}
      </span>
      <span>{{ content.text.title }}</span>
    </header>
    <div class="map-page-figure" :style="{ aspectRatio: MAP_ASPECT }">
      <canvas ref="canvas" class="map-page-canvas" aria-hidden="true" />
    </div>
    <p class="map-page-headline">
      <strong>{{ content.text.count }}</strong>
      {{ content.text.countLabel }}
    </p>
    <dl class="map-page-stats">
      <div v-for="row in content.text.statRows" :key="row.key" class="map-page-stat">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </div>
    </dl>
    <p class="map-page-machine" aria-hidden="true">
      <span v-for="line in content.text.machineLines" :key="line" class="map-page-machine-line">
        <span v-for="(character, index) in line" :key="index">{{ character }}</span>
      </span>
    </p>
  </section>
</template>

<script setup vapor lang="ts">
import { useTemplateRef, watch } from 'vue'
import { APP_NAME } from '@/brand/logo'
import type { CountryCode } from '@/countries'
import { drawWorldSnapshot, MAP_ASPECT, type ProjectionId } from '@/map'
import StampedLogo from './StampedLogo.vue'
import { useCanvasRedraw } from './useCanvasRedraw'
import { usePassportContent } from './usePassportContent'

const props = defineProps<{
  projection: ProjectionId
  visited: readonly CountryCode[]
}>()

const BORDER_WIDTH_CSS_PX = 0.5

const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const content = usePassportContent(() => props.visited)

let latestDrawId = 0

// paints off screen, so a draw that finishes after a newer one never covers it
const drawMap = async () => {
  const element = canvas.value
  if (!element || element.clientWidth === 0) return
  const drawId = ++latestDrawId
  const pixelRatio = window.devicePixelRatio || 1
  const buffer = document.createElement('canvas')
  buffer.width = Math.round(element.clientWidth * pixelRatio)
  buffer.height = Math.round(element.clientHeight * pixelRatio)
  const bufferContext = buffer.getContext('2d')
  if (!bufferContext) return
  await drawWorldSnapshot(bufferContext, {
    projection: props.projection,
    visited: props.visited,
    rect: { x: 0, y: 0, width: buffer.width, height: buffer.height },
    borderWidth: BORDER_WIDTH_CSS_PX * pixelRatio,
  })
  if (drawId !== latestDrawId) return
  element.width = buffer.width
  element.height = buffer.height
  element.getContext('2d')?.drawImage(buffer, 0, 0)
}

// a map file that failed to load is fetched again on the next redraw
const redrawMap = () => drawMap().catch(() => undefined)

useCanvasRedraw({ canvas, redraw: redrawMap })
watch(() => props.visited, redrawMap)
</script>

<style scoped>
.map-page {
  --rule: color-mix(in srgb, currentColor 16%, transparent);

  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
}

.map-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--rule);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.map-page-brand {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.map-page-logo {
  --logo-globe: var(--map-visited);

  width: 22px;
  height: 22px;
  margin-block: -4px;
}

.map-page-figure {
  position: relative;
  flex: none;
  margin: auto -12px 0;
}

.map-page-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.map-page-headline {
  display: flex;
  gap: 10px;
  align-items: baseline;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.map-page-headline strong {
  font-size: 40px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.map-page-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 0;
}

/* labels wrap differently per language, so the values line up at the bottom */
.map-page-stat {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-left: 10px;
  border-left: 2px solid var(--rule);
}

.map-page-stat dt {
  opacity: 0.6;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.map-page-stat dd {
  margin: 4px 0 0;
  font-size: 17px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 600px) {
  .map-page-stat dd {
    font-size: 14px;
    white-space: nowrap;
  }
}

.map-page-machine {
  display: grid;
  gap: 2px;
  margin: auto 0 0;
  padding-top: 10px;
  border-top: 1px solid var(--rule);
  font: 600 clamp(9px, 2.7cqi, 14px) / 1.4 var(--font-mono);
  opacity: 0.5;
}

.map-page-machine-line {
  display: flex;
  justify-content: space-between;
}
</style>
