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
          Where I've been
          <span class="brand-count">{{ visited.length }} of {{ COUNTRY_CODES.length }}</span>
        </h1>
        <CountrySearch :is-visited="isVisited" @toggle="toggleVisited" />
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
import WorldMap from '@/ui/WorldMap.vue'
import { useTravelMap } from '@/useTravelMap'

const { projection, visited, isVisited, toggleVisited } = useTravelMap()
</script>

<style scoped>
.app {
  height: 100dvh;
  padding: 12px;
}

.stage {
  --overlay-inset: 16px;
  --map-padding-x: 48px;
  --map-padding-y: 88px;
  --hover-inset-y: 76px;

  position: relative;
  height: 100%;
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
    padding: 8px;
  }

  .stage {
    --overlay-inset: 10px;
    --map-padding-x: 12px;
    --map-padding-y: 140px;
    --hover-inset-y: 124px;
    --zoom-inset-x: 10px;
    --zoom-inset-y: 112px;
    --radius-stage: 24px;
  }

  .stage-top > * {
    flex: 1 1 100%;
  }

  .brand {
    justify-content: space-between;
  }

  .stage-bottom {
    padding-right: 0;
  }
}
</style>
