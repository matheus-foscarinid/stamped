<template>
  <div class="world-map">
    <canvas
      ref="canvas"
      class="world-map-canvas"
      role="img"
      aria-label="World map of the countries you visited. Use the search to add countries with the keyboard"
    />
    <p v-if="hoveredCode" class="world-map-hover control-surface" aria-hidden="true">
      {{ getFlagEmoji(hoveredCode) }} {{ getCountryName(hoveredCode) }}
    </p>
    <div class="world-map-zoom">
      <button type="button" class="zoom-button control-surface" aria-label="Zoom in" @click="zoomIn">+</button>
      <button type="button" class="zoom-button control-surface" aria-label="Zoom out" @click="zoomOut">−</button>
      <button type="button" class="zoom-button control-surface" aria-label="Reset zoom" @click="resetZoom">⟲</button>
    </div>
    <p v-if="hasLoadError" class="world-map-error" role="alert">
      The map couldn't load. Refresh to try again.
    </p>
  </div>
</template>

<script setup vapor lang="ts">
import { useTemplateRef } from 'vue'
import { type CountryCode, getCountryName, getFlagEmoji } from '@/countries'
import type { ProjectionId } from '@/map'
import { useWorldMap } from './useWorldMap'

const props = defineProps<{
  projection: ProjectionId
  visited: readonly string[]
}>()

const emit = defineEmits<{
  toggle: [code: CountryCode]
}>()

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
  top: 12px;
  left: 12px;
  margin: 0;
  padding: 6px 12px;
  border-radius: var(--radius-control);
  pointer-events: none;
}

.world-map-zoom {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: grid;
  gap: 4px;
}

.zoom-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
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
