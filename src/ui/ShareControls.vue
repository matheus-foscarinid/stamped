<template>
  <div class="share-controls">
    <button type="button" class="share-button control-surface" @click="copyLink">Copy link</button>
    <fieldset class="share-formats control-surface" :aria-busy="isSaving">
      <legend class="visually-hidden">Save as image</legend>
      <span class="share-formats-label" aria-hidden="true">Save image</span>
      <button
        v-for="option in EXPORT_FORMAT_OPTIONS"
        :key="option.id"
        type="button"
        class="share-format"
        :aria-disabled="isSaving"
        :aria-label="option.ariaLabel"
        @click="saveImage(option.id)"
      >
        {{ option.label }}
      </button>
    </fieldset>
    <p class="share-status" role="status">{{ status }}</p>
  </div>
</template>

<script setup vapor lang="ts">
import type { CountryCode } from '@/countries'
import type { ProjectionId } from '@/map'
import { EXPORT_FORMAT_OPTIONS } from '@/share/card-layout'
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

/* aria-disabled, not disabled, so the pressed button keeps keyboard focus */
.share-formats[aria-busy='true'] {
  opacity: 0.6;
  cursor: progress;
}

.share-formats-label {
  margin-right: 4px;
  color: var(--text-muted);
}

.share-format {
  border: 0;
  background: transparent;
}

.share-format:hover:not([aria-disabled='true']) {
  background: var(--control-hover-bg);
}

.share-status {
  margin: 0;
  color: var(--text-muted);
}
</style>
