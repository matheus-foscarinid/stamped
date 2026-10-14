<template>
  <span
    class="passport-stamp"
    role="img"
    :aria-label="labels.name"
    :style="{ '--stamp-hue': style.hue, '--stamp-tilt': `${style.tiltDeg}deg` }"
    v-html="svg"
  />
</template>

<script setup vapor lang="ts">
import { computed } from 'vue'
import type { CountryCode } from '@/countries'
import { buildStampSvg } from '@/passport/stamp-generator'
import { getStampStyle } from '@/passport/stamp-style'
import { useStampLabels } from './useStampLabels'

const props = defineProps<{ code: CountryCode }>()

const describeStamp = useStampLabels()

const style = computed(() => getStampStyle(props.code))
const labels = computed(() => describeStamp(props.code))
const svg = computed(() => buildStampSvg({ code: props.code, ...labels.value }))
</script>

<style scoped>
.passport-stamp {
  display: block;
  width: 100%;
  height: 100%;
  color: hsl(var(--stamp-hue) 62% var(--stamp-lightness));
  opacity: var(--stamp-opacity);
  rotate: var(--stamp-tilt);
  mix-blend-mode: var(--stamp-blend, normal);
  transition:
    scale var(--motion-base) var(--ease-out),
    opacity var(--motion-base) var(--ease-out);
}

@starting-style {
  .passport-stamp {
    opacity: 0;
    scale: 1.3;
  }
}

.passport-stamp :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
</style>
