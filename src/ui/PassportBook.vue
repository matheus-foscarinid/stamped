<template>
  <section class="passport-stage" :aria-label="t('view.passport')">
    <div class="book">
      <div ref="track" class="book-track">
        <PassportStampPage class="book-page" :visited="visited" />
        <PassportMapPage class="book-page" :projection="projection" :visited="visited" />
      </div>
      <PassportCover />
    </div>
    <div class="passport-controls">
      <PassportNav
        v-if="spreadCount > 1"
        :spread-index="spreadIndex"
        :spread-count="spreadCount"
        @turn="turnBy"
      />
      <PassportCoverPicker />
    </div>
  </section>
</template>

<script setup vapor lang="ts">
import { useTemplateRef } from 'vue'
import type { CountryCode } from '@/countries'
import { useI18n } from '@/i18n/useI18n'
import type { ProjectionId } from '@/map'
import PassportCover from './PassportCover.vue'
import PassportCoverPicker from './PassportCoverPicker.vue'
import PassportMapPage from './PassportMapPage.vue'
import PassportNav from './PassportNav.vue'
import PassportStampPage from './PassportStampPage.vue'
import { usePassportPages } from './usePassportPages'

defineProps<{
  projection: ProjectionId
  visited: readonly CountryCode[]
}>()

const { t } = useI18n()
const track = useTemplateRef<HTMLElement>('track')
const { spreadIndex, spreadCount, turnBy } = usePassportPages({ track })
</script>

<style scoped>
.passport-stage {
  --book-turn: calc(var(--motion-base) * 4);
  --ease-turn: cubic-bezier(0.55, 0, 0.3, 1);

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
  perspective: 2600px;
  transition:
    translate var(--book-turn) var(--ease-turn),
    background-color calc(var(--book-turn) * 0.4) linear calc(var(--book-turn) * 0.35),
    box-shadow calc(var(--book-turn) * 0.4) linear calc(var(--book-turn) * 0.35);
}

@starting-style {
  .book {
    translate: -25% 0;
    background-color: transparent;
    box-shadow: none;
  }
}

.passport-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
}

.book-track {
  display: flex;
  height: 100%;
  overflow-x: auto;
  border-radius: 10px;
  color: var(--passport-ink);
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.book-page {
  flex: 0 0 50%;
  min-width: 0;
  padding: 22px 26px;
  background:
    radial-gradient(120% 90% at 50% 50%, transparent 55%, var(--passport-paper-line)),
    var(--passport-paper);
  scroll-snap-align: start;
}

@media (min-width: 601px) {
  .book-page:nth-child(odd) {
    box-shadow: inset -18px 0 18px -18px rgb(0 0 0 / 0.25);
  }

  .book-page:nth-child(even) {
    box-shadow: inset 18px 0 18px -18px rgb(0 0 0 / 0.25);
  }

  .book-page:first-child {
    transition: opacity calc(var(--book-turn) * 0.25) linear calc(var(--book-turn) * 0.6);
  }

  @starting-style {
    .book-page:first-child {
      opacity: 0;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .book-track {
    scroll-behavior: auto;
  }
}

@media (max-width: 600px) {
  .passport-stage {
    padding-bottom: calc(var(--overlay-inset) + var(--control-height) + 10px);
  }

  .book {
    max-height: none;
  }

  @starting-style {
    .book {
      translate: none;
    }
  }

  .book-page {
    flex-basis: 100%;
    padding: 18px;
  }

  .passport-controls {
    gap: 10px;
  }
}
</style>
