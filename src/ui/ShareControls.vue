<template>
  <div class="share-controls">
    <button type="button" class="share-button control-surface press-feedback" @click="copyLink">
      Copy link
    </button>
    <div ref="menuRoot" class="menu-button">
      <button
        ref="menuTrigger"
        type="button"
        class="menu-trigger control-surface press-feedback"
        :aria-expanded="isOpen"
        aria-controls="save-image-menu"
        @click="toggle"
      >
        Save image
      </button>
      <div
        v-show="isOpen"
        id="save-image-menu"
        class="menu-panel control-surface"
        data-placement="above"
        data-align="start"
      >
        <button
          v-for="option in EXPORT_FORMAT_OPTIONS"
          :key="option.id"
          type="button"
          class="menu-item"
          :aria-disabled="isSaving"
          @click="pickFormat(option.id)"
        >
          {{ option.label }}
          <span class="menu-item-hint">{{ option.size }}</span>
        </button>
      </div>
    </div>
    <p class="share-status" role="status">{{ status }}</p>
  </div>
</template>

<script setup vapor lang="ts">
import { useTemplateRef } from 'vue'
import type { CountryCode } from '@/countries'
import type { ProjectionId } from '@/map'
import { EXPORT_FORMAT_OPTIONS, type ExportFormat } from '@/share/card-layout'
import { useDismissibleMenu } from './useDismissibleMenu'
import { useShareControls } from './useShareControls'

const props = defineProps<{
  projection: ProjectionId
  visited: readonly CountryCode[]
}>()

const { status, isSaving, copyLink, saveImage } = useShareControls({
  projection: () => props.projection,
  visited: () => props.visited,
})

const menuRoot = useTemplateRef<HTMLElement>('menuRoot')
const menuTrigger = useTemplateRef<HTMLButtonElement>('menuTrigger')
const { isOpen, toggle, close } = useDismissibleMenu({ root: menuRoot, trigger: menuTrigger })

const pickFormat = (format: ExportFormat) => {
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
  padding: var(--button-padding);
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
