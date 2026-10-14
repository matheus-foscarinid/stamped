<template>
  <svg class="stamped-logo" :viewBox="LOGO_VIEWBOX" aria-hidden="true">
    <g :transform="LOGO_TILT">
      <path class="stamped-logo-frame" fill-rule="evenodd" :d="STAMP_PATH" />
      <path class="stamped-logo-globe" :d="STAMPED_CELL_PATH" />
      <path class="stamped-logo-lines" :stroke-width="GLOBE_LINE_WIDTH" :d="GLOBE_LINES_PATH" />
    </g>
  </svg>
</template>

<script setup vapor lang="ts">
import {
  GLOBE_LINE_WIDTH,
  GLOBE_LINES_PATH,
  LOGO_TILT,
  LOGO_VIEWBOX,
  STAMP_PATH,
  STAMPED_CELL_PATH,
} from '@/brand/logo'
</script>

<style scoped>
.stamped-logo-frame {
  fill: var(--logo-frame, currentColor);
}

.stamped-logo-globe {
  fill: var(--logo-globe, currentColor);
}

.stamped-logo-lines {
  fill: none;
  stroke: var(--logo-lines, var(--logo-globe, currentColor));
  stroke-linecap: round;
}
</style>
