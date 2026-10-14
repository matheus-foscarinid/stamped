<template>
  <div class="share-controls">
    <button type="button" class="share-button control-surface press-feedback" @click="copyLink">
      Copy link
    </button>
    <fieldset class="share-formats control-surface" :aria-busy="isSaving">
      <legend class="visually-hidden">Save as image</legend>
      <span class="share-formats-label" aria-hidden="true">Save image</span>
      <button
        v-for="option in EXPORT_FORMAT_OPTIONS"
        :key="option.id"
        type="button"
        class="share-format press-feedback"
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
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.share-button {
  padding: 11px 18px;
  border-radius: var(--radius-control);
  cursor: pointer;
}

.share-button:hover {
  background: var(--glass-hover);
}

.share-formats {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  min-width: 0;
  margin: 0;
  padding: 4px 4px 4px 18px;
  border-radius: var(--radius-control);
}

/* aria-disabled, not disabled, so the pressed button keeps keyboard focus */
.share-formats[aria-busy='true'] {
  opacity: 0.6;
  cursor: progress;
}

.share-formats-label {
  margin-right: 6px;
  color: var(--text-muted);
}

.share-format {
  padding: 7px 14px;
  border: 0;
  border-radius: var(--radius-control);
  background: transparent;
  cursor: pointer;
}

.share-format:hover:not([aria-disabled='true']) {
  background: var(--control-hover-bg);
}

.share-status {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 0;
  margin: 0;
  padding: 7px 14px;
  border-radius: var(--radius-control);
  background: var(--control-active-bg);
  color: var(--control-active-text);
  font-weight: 550;
  white-space: nowrap;
  pointer-events: none;
  transition:
    opacity var(--motion-fast) var(--ease-out),
    translate var(--motion-base) var(--ease-out);
}

.share-status:empty {
  opacity: 0;
  translate: 0 6px;
}
</style>
