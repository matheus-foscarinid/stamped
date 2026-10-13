<template>
  <div class="world-map">
    <canvas
      ref="canvas"
      class="world-map-canvas"
      role="img"
      aria-label="World map of the countries you visited"
    />
    <p v-if="hasLoadError" class="world-map-error" role="alert">
      The map couldn't load. Refresh to try again.
    </p>
  </div>
</template>

<script setup vapor lang="ts">
import { useTemplateRef } from 'vue'
import type { ProjectionId } from '@/map'
import { useWorldMap } from './useWorldMap'

const props = defineProps<{
  projection: ProjectionId
  visited: readonly string[]
}>()

const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const { hasLoadError } = useWorldMap({
  canvas,
  projection: () => props.projection,
  visited: () => props.visited,
})
</script>

<style scoped>
.world-map {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 1;
}

.world-map-canvas {
  display: block;
  width: 100%;
  height: 100%;
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
