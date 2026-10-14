<template>
  <div class="world-map">
    <canvas
      ref="canvas"
      class="world-map-canvas"
      role="img"
      :aria-label="t('map.label')"
    />
    <p v-if="hoveredCode" class="world-map-hover control-surface" aria-hidden="true">
      <span>{{ getFlagEmoji(hoveredCode) }}</span>
      {{ getCountryName(hoveredCode, language) }}
    </p>
    <div class="world-map-zoom control-surface">
      <button type="button" class="zoom-button press-feedback" :aria-label="t('map.zoomIn')" @click="zoomIn">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
      </button>
      <button type="button" class="zoom-button press-feedback" :aria-label="t('map.zoomOut')" @click="zoomOut">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" /></svg>
      </button>
      <button type="button" class="zoom-button press-feedback" :aria-label="t('map.resetZoom')" @click="resetZoom">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 6V3h3M10 3h3v3M13 10v3h-3M6 13H3v-3" />
        </svg>
      </button>
    </div>
    <p v-if="hasLoadError" class="world-map-error" role="alert">
      {{ t('map.loadError') }}
    </p>
  </div>
</template>

<script setup vapor lang="ts">
import { useTemplateRef } from 'vue'
import { type CountryCode, getCountryName, getFlagEmoji } from '@/countries'
import { useI18n } from '@/i18n/useI18n'
import type { ProjectionId } from '@/map'
import { useWorldMap } from './useWorldMap'

const props = defineProps<{
  projection: ProjectionId
  visited: readonly string[]
}>()

const emit = defineEmits<{
  toggle: [code: CountryCode]
}>()

const { language, t } = useI18n()
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const { hasLoadError, hoveredCode, zoomIn, zoomOut, resetZoom } = useWorldMap({
  canvas,
  projection: () => props.projection,
  visited: () => props.visited,
  onToggle: code => emit('toggle', code),
})
</script>

<style scoped>
.world-map {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.world-map-canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}

.world-map-hover {
  position: absolute;
  top: var(--hover-inset-y, 12px);
  left: 50%;
  display: flex;
  gap: 8px;
  margin: 0;
  padding: 7px 14px;
  border-radius: var(--radius-control);
  font-weight: 550;
  white-space: nowrap;
  pointer-events: none;
  translate: -50% 0;
  transition:
    opacity var(--motion-fast) var(--ease-out),
    translate var(--motion-fast) var(--ease-out);
}

@starting-style {
  .world-map-hover {
    opacity: 0;
    translate: -50% -4px;
  }
}

.world-map-zoom {
  position: absolute;
  right: var(--zoom-inset-x, 16px);
  bottom: var(--zoom-inset-y, 16px);
  display: grid;
  padding: 4px;
  border-radius: var(--radius-control);
}

.zoom-button {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}

.zoom-button:hover {
  background: var(--control-hover-bg);
}

.zoom-button svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.world-map-error {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  color: var(--text-muted);
}
</style>
