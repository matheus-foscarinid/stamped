<template>
  <main class="app">
    <div class="stage">
      <WorldMap
        class="stage-map"
        :projection="projection"
        :visited="visited"
        @toggle="toggleVisited"
      />
      <header class="stage-top">
        <h1 class="brand control-surface">
          Stamped
          <span class="brand-count">{{ visited.length }} of {{ COUNTRY_CODES.length }}</span>
        </h1>
        <CountrySearch class="stage-search" :is-visited="isVisited" @toggle="toggleVisited" />
        <ThemePicker />
      </header>
      <footer class="stage-bottom">
        <ShareControls :projection="projection" :visited="visited" />
      </footer>
    </div>
  </main>
</template>

<script setup vapor lang="ts">
import { COUNTRY_CODES } from '@/countries'
import CountrySearch from '@/ui/CountrySearch.vue'
import ShareControls from '@/ui/ShareControls.vue'
import ThemePicker from '@/ui/ThemePicker.vue'
import WorldMap from '@/ui/WorldMap.vue'
import { useTravelMap } from '@/useTravelMap'

const { projection, visited, isVisited, toggleVisited } = useTravelMap()
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
  background: var(--surface);
}

.stage-map {
  position: absolute;
  inset: 0;
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

.stage-bottom {
  bottom: var(--overlay-inset);
  padding-right: 60px;
}

.brand {
  display: inline-flex;
  gap: 10px;
  align-items: baseline;
  margin: 0;
  padding: 11px 18px;
  border-radius: var(--radius-control);
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.brand-count {
  color: var(--text-muted);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
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
  }

  .brand {
    flex: 1;
    justify-content: space-between;
  }

  .stage-search {
    flex: 1 1 100%;
    order: 1;
  }

}
</style>
