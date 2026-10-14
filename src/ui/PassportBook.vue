<template>
  <section class="passport-stage" :aria-label="t('view.passport')">
    <div class="book" :data-open="isOpen">
      <div ref="track" class="book-track">
        <PassportStampPage class="book-page" :page="stampPages[0] ?? null" />
        <PassportMapPage class="book-page" :projection="projection" :visited="visited" />
        <PassportStampPage
          v-for="page in stampPages.slice(1)"
          :key="`${page.continent}-${page.codes[0]}`"
          class="book-page"
          :page="page"
        />
      </div>
      <div class="book-cover" aria-hidden="true">
        <div class="book-cover-front">
          <svg class="book-cover-crest" :viewBox="LOGO_VIEWBOX" aria-hidden="true">
            <g :transform="LOGO_TILT">
              <path fill-rule="evenodd" :d="STAMP_PATH" />
              <path :d="STAMPED_CELL_PATH" />
              <path class="book-cover-lines" :stroke-width="GLOBE_LINE_WIDTH" :d="GLOBE_LINES_PATH" />
            </g>
          </svg>
          <span class="book-cover-title">Stamped</span>
          <span class="book-cover-subtitle">{{ t('view.passport') }}</span>
        </div>
        <div class="book-cover-back" />
      </div>
    </div>
    <nav v-if="spreadCount > 1" class="book-nav">
      <button
        type="button"
        class="book-nav-button control-surface press-feedback"
        :aria-label="t('passport.previous')"
        :disabled="spreadIndex === 0"
        @click="turnBy(-1)"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" /></svg>
      </button>
      <span class="book-nav-count">{{ spreadIndex + 1 }} / {{ spreadCount }}</span>
      <button
        type="button"
        class="book-nav-button control-surface press-feedback"
        :aria-label="t('passport.next')"
        :disabled="spreadIndex === spreadCount - 1"
        @click="turnBy(1)"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" /></svg>
      </button>
    </nav>
  </section>
</template>

<script setup vapor lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import {
  GLOBE_LINE_WIDTH,
  GLOBE_LINES_PATH,
  LOGO_TILT,
  LOGO_VIEWBOX,
  STAMP_PATH,
  STAMPED_CELL_PATH,
} from '@/brand/logo'
import { type CountryCode, groupByContinent } from '@/countries'
import { useI18n } from '@/i18n/useI18n'
import type { ProjectionId } from '@/map'
import { paginateStamps } from '@/passport/pages'
import PassportMapPage from './PassportMapPage.vue'
import PassportStampPage from './PassportStampPage.vue'
import { usePassportPages } from './usePassportPages'

const props = defineProps<{
  projection: ProjectionId
  visited: readonly CountryCode[]
}>()

const STAMPS_PER_PAGE = 6

const { language, t } = useI18n()
const track = useTemplateRef<HTMLElement>('track')
const { spreadIndex, spreadCount, turnBy, measure } = usePassportPages({ track })

const stampPages = computed(() =>
  paginateStamps(groupByContinent(props.visited, language.value), STAMPS_PER_PAGE)
)
watch(stampPages, () => nextTick(measure))

// mounts closed, then opens on the next frame so the cover turn plays every time
const isOpen = ref(false)
onMounted(() => {
  requestAnimationFrame(() => {
    isOpen.value = true
  })
})
</script>

<style scoped>
.passport-stage {
  --book-turn: calc(var(--motion-base) * 3.2);

  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) var(--control-height);
  gap: 14px;
  place-items: center;
  height: 100%;
  padding: var(--map-padding-y) var(--map-padding-x) var(--overlay-inset);
}

.book {
  position: relative;
  width: min(100%, 960px);
  height: 100%;
  max-height: 640px;
  padding: 10px;
  border-radius: 18px;
  background: var(--passport-cover-dark);
  box-shadow: 0 24px 60px -24px rgb(0 0 0 / 0.5);
  perspective: 1800px;
  transition:
    translate var(--book-turn) var(--ease-out),
    background-color var(--motion-base) linear calc(var(--book-turn) * 0.4),
    box-shadow var(--motion-base) linear calc(var(--book-turn) * 0.4);
}

/* closed, only the cover shows, centred where the open book will be */
.book[data-open="false"] {
  translate: -25% 0;
  background-color: transparent;
  box-shadow: none;
}

.book-track {
  display: flex;
  height: 100%;
  overflow-x: auto;
  border-radius: 10px;
  background:
    radial-gradient(120% 90% at 50% 50%, transparent 55%, var(--passport-paper-line)),
    var(--passport-paper);
  color: var(--passport-ink);
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  opacity: 0;
  transition: opacity var(--motion-base) var(--ease-out) calc(var(--book-turn) * 0.6);
}

.book[data-open="true"] .book-track {
  opacity: 1;
}

.book-page {
  flex: 0 0 50%;
  padding: 22px 26px;
  scroll-snap-align: start;
}

/* the fold between the two pages of a spread */
.book-page:nth-child(odd) {
  box-shadow: inset -18px 0 18px -18px rgb(0 0 0 / 0.25);
}

.book-page:nth-child(even) {
  box-shadow: inset 18px 0 18px -18px rgb(0 0 0 / 0.25);
}

/* the cover lies on the right page and swings open on the spine */
.book-cover {
  position: absolute;
  inset: 0 0 0 50%;
  transform-origin: left center;
  transform-style: preserve-3d;
  transition:
    transform var(--book-turn) var(--ease-out),
    visibility 0s linear var(--book-turn);
}

.book[data-open="true"] .book-cover {
  transform: rotateY(-180deg);
  visibility: hidden;
}

.book-cover-front,
.book-cover-back {
  position: absolute;
  inset: 0;
  border-radius: 4px 18px 18px 4px;
  backface-visibility: hidden;
}

.book-cover-front {
  display: grid;
  grid-template-rows: 1fr auto auto 1fr;
  justify-items: center;
  gap: 10px;
  background:
    linear-gradient(90deg, rgb(0 0 0 / 0.35), transparent 8%),
    radial-gradient(120% 80% at 30% 20%, rgb(255 255 255 / 0.12), transparent 60%),
    var(--passport-cover);
  color: var(--passport-gold);
}

.book-cover-back {
  background: var(--passport-paper);
  transform: rotateY(180deg);
}

.book-cover-crest {
  grid-row: 1;
  align-self: end;
  width: 30%;
  fill: currentColor;
}

.book-cover-lines {
  fill: none;
  stroke: var(--passport-cover);
  stroke-linecap: round;
}

.book-cover-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.32em;
  text-transform: uppercase;
}

.book-cover-subtitle {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.4em;
  text-transform: uppercase;
}

.book-nav {
  display: flex;
  gap: 12px;
  align-items: center;
}

.book-nav-button {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  cursor: pointer;
}

.book-nav-button:disabled {
  opacity: 0.4;
  cursor: default;
}

.book-nav-button svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.book-nav-count {
  min-width: 48px;
  color: var(--text-muted);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .book-track {
    scroll-behavior: auto;
  }
}

/* phones read one page at a time, swiping between them */
@media (max-width: 600px) {
  /* the share buttons take two rows here, so the book stops above them */
  .passport-stage {
    padding-bottom: calc(var(--overlay-inset) + 2 * var(--control-height) + 20px);
  }

  .book {
    max-height: none;
  }

  .book[data-open="false"] {
    translate: none;
  }

  .book-page,
  .book-page:nth-child(n) {
    flex-basis: 100%;
    padding: 18px;
    box-shadow: none;
  }

  .book-cover {
    inset: 0;
  }
}
</style>
