<template>
  <fieldset class="projection-toggle control-surface">
    <legend class="visually-hidden">Map projection</legend>
    <button
      v-for="id in PROJECTION_IDS"
      :key="id"
      type="button"
      class="projection-option"
      :aria-pressed="id === projection"
      @click="projection = id"
    >
      {{ PROJECTION_LABELS[id] }}
    </button>
  </fieldset>
</template>

<script setup vapor lang="ts">
import { PROJECTION_IDS, PROJECTION_LABELS, type ProjectionId } from '@/map'

const projection = defineModel<ProjectionId>({ required: true })
</script>

<style scoped>
.projection-toggle {
  min-width: 0;
  margin: 0;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  border-radius: var(--radius-control);
}

.projection-option {
  padding: 6px 14px;
  border: 0;
  border-radius: var(--radius-control);
  background: transparent;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
}

.projection-option[aria-pressed='true'] {
  background: var(--control-active-bg);
  color: var(--control-active-text);
  opacity: 1;
}
</style>
