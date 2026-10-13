<template>
  <div class="share-controls">
    <button type="button" class="share-button control-surface" @click="copyLink">Copy link</button>
    <fieldset class="share-formats control-surface" :disabled="isSaving">
      <legend class="visually-hidden">Save as image</legend>
      <span class="share-formats-label" aria-hidden="true">Save image</span>
      <button
        v-for="format in EXPORT_FORMAT_IDS"
        :key="format"
        type="button"
        class="share-format"
        :aria-label="`Save ${EXPORT_FORMATS[format].label.toLowerCase()} image, ${EXPORT_FORMATS[format].width} by ${EXPORT_FORMATS[format].height}`"
        @click="saveImage(format)"
      >
        {{ EXPORT_FORMATS[format].label }}
      </button>
    </fieldset>
    <p class="share-status" role="status">{{ status }}</p>
  </div>
</template>

<script setup vapor lang="ts">
import type { CountryCode } from '@/countries'
import type { ProjectionId } from '@/map'
import { EXPORT_FORMAT_IDS, EXPORT_FORMATS } from '@/share/card-layout'
import { useShareControls } from './useShareControls'

const props = defineProps<{
  projection: ProjectionId
  visited: readonly CountryCode[]
}>()

const { status, isSaving, copyLink, saveImage } = useShareControls({
  projection: () => props.projection,
  visited: () => props.visited,
})
</script>

<style scoped>
.share-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: center;
  justify-content: center;
}

.share-button,
.share-format {
  padding: 6px 14px;
  border-radius: var(--radius-control);
  cursor: pointer;
}

.share-formats {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  min-width: 0;
  margin: 0;
  padding: 4px 4px 4px 14px;
  border-radius: var(--radius-control);
}

.share-formats:disabled {
  opacity: 0.6;
}

.share-formats-label {
  margin-right: 4px;
  color: var(--text-muted);
}

.share-format {
  border: 0;
  background: transparent;
}

.share-format:hover:not(:disabled) {
  background: var(--control-hover-bg);
}

.share-status {
  margin: 0;
  color: var(--text-muted);
}
</style>
