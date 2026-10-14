<template>
  <div class="share-controls">
    <button type="button" class="share-button control-surface press-feedback" @click="copyLink">
      Copy link
    </button>
    <MenuButton placement="above">
      <template #trigger>Save image</template>
      <template #default="{ close }">
        <button
          v-for="option in EXPORT_FORMAT_OPTIONS"
          :key="option.id"
          type="button"
          class="menu-item"
          :aria-disabled="isSaving"
          @click="pickFormat(option.id, close)"
        >
          {{ option.label }}
          <span class="menu-item-hint">{{ option.size }}</span>
        </button>
      </template>
    </MenuButton>
    <p class="share-status" role="status">{{ status }}</p>
  </div>
</template>

<script setup vapor lang="ts">
import type { CountryCode } from '@/countries'
import type { ProjectionId } from '@/map'
import { EXPORT_FORMAT_OPTIONS, type ExportFormat } from '@/share/card-layout'
import MenuButton from './MenuButton.vue'
import { useShareControls } from './useShareControls'

const props = defineProps<{
  projection: ProjectionId
  visited: readonly CountryCode[]
}>()

const { status, isSaving, copyLink, saveImage } = useShareControls({
  projection: () => props.projection,
  visited: () => props.visited,
})

const pickFormat = (format: ExportFormat, close: () => void) => {
  close()
  saveImage(format)
}
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
