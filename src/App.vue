<template>
  <main class="app">
    <div class="stage glass-panel">
      <WorldMap
        class="stage-map"
        :inert="isPassportOpen"
        :data-hidden="isPassportOpen"
        :projection="projection"
        :visited="visited"
        :wishlist="wishlist"
        @toggle="toggleCountry"
      />
      <PassportBook v-if="isPassportOpen" class="stage-map" :projection="projection" :visited="visited" />
      <header class="stage-top">
        <TravelSummary class="stage-summary" :visited="visited" />
        <CountrySearch
          class="stage-search"
          :get-mark="getMark"
          :is-wishlist-mode="isWishlistMode"
          @toggle="toggleCountry"
          @toggle-mode="toggleWishlistMode"
        />
        <button
          type="button"
          class="view-toggle stage-view-toggle icon-label-button control-surface press-feedback"
          @click="togglePassport"
        >
          <svg v-if="isPassportOpen" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M1.5 3.5l4-1.5 5 2 4-1.5v10l-4 1.5-5-2-4 1.5zM5.5 2v10M10.5 4v10" />
          </svg>
          <svg v-else viewBox="0 0 16 16" aria-hidden="true">
            <rect x="3" y="1.5" width="10" height="13" rx="1.5" />
            <circle cx="8" cy="7" r="2.5" />
            <path d="M6 11.5h4" />
          </svg>
          <span>
            {{ isPassportOpen ? t('view.map') : t('view.passport') }}
          </span>
        </button>
        <div class="stage-pickers">
          <LanguagePicker />
          <ThemePicker />
        </div>
        <GitHubLink class="stage-github" />
      </header>
      <footer class="stage-bottom">
        <ShareControls :projection="projection" :visited="visited" />
        <ClearMapButton :count="markedCount" @clear="clearMap" />
      </footer>
    </div>
  </main>
</template>

<script setup vapor lang="ts">
import { useI18n } from '@/i18n/useI18n'
import ClearMapButton from '@/ui/ClearMapButton.vue'
import CountrySearch from '@/ui/CountrySearch.vue'
import GitHubLink from '@/ui/GitHubLink.vue'
import LanguagePicker from '@/ui/LanguagePicker.vue'
import PassportBook from '@/ui/PassportBook.vue'
import ShareControls from '@/ui/ShareControls.vue'
import ThemePicker from '@/ui/ThemePicker.vue'
import TravelSummary from '@/ui/TravelSummary.vue'
import WorldMap from '@/ui/WorldMap.vue'
import { useTravelMap } from '@/useTravelMap'

const {
  projection,
  visited,
  wishlist,
  markedCount,
  getMark,
  toggleCountry,
  clearMap,
  isWishlistMode,
  toggleWishlistMode,
  isPassportOpen,
  togglePassport,
} = useTravelMap()
const { t } = useI18n()
</script>

<style scoped>
.app {
  height: 100dvh;
  padding: 28px 12px;
}

.stage {
  --overlay-inset: 16px;
  --map-padding-x: 48px;
  --map-padding-y: 88px;
  --hover-inset-y: 76px;

  position: relative;
  max-width: 1680px;
  height: 100%;
  margin-inline: auto;
  overflow: hidden;
  isolation: isolate;
  border-radius: var(--radius-stage);
  background: color-mix(in srgb, var(--surface) 82%, transparent);
}

.stage-map {
  position: absolute;
  inset: 0;
}

/* hidden, not unmounted, so the map keeps its zoom while the passport is open */
.stage-map[data-hidden="true"] {
  visibility: hidden;
}

.view-toggle:hover {
  background: var(--glass-hover);
}

/* the bars let map drags through their gaps, only the controls catch the pointer */
.stage-top,
.stage-bottom {
  position: absolute;
  inset-inline: var(--overlay-inset);
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-start;
  justify-content: space-between;
  pointer-events: none;
}

.stage-top > *,
.stage-bottom > * {
  pointer-events: auto;
}

.stage-top {
  top: var(--overlay-inset);
}

.stage-search {
  margin-left: auto;
}

.stage-pickers {
  display: flex;
  gap: 10px;
}

.stage-bottom {
  bottom: var(--overlay-inset);
  justify-content: flex-start;
  padding-right: 60px;
}

@media (max-width: 600px) {
  .app {
    padding: 16px 8px;
  }

  .stage {
    --overlay-inset: 10px;
    --map-padding-x: 12px;
    --map-padding-y: 140px;
    --hover-inset-y: 124px;
    --zoom-inset-x: 10px;
    --zoom-inset-y: 10px;
    --map-start-zoom: 1.9;
    --radius-stage: 24px;
    --button-padding: 11px 12px;
  }

  .stage-summary {
    flex: 1;
  }

  /* the passport and github buttons share the search row, so the top row keeps room for the pickers */
  .stage-search {
    flex: 1 1 calc(100% - 2 * var(--control-height) - 20px);
    order: 1;
  }

  .stage-view-toggle {
    order: 2;
  }

  .stage-github {
    order: 3;
  }

}
</style>
