<template>
  <main class="mono">
    <header class="mono-header">
      <h1 class="mono-title">Where I've been</h1>
      <p class="mono-count">{{ visited.length }} of {{ COUNTRY_CODES.length }} countries</p>
      <CountrySearch :is-visited="isVisited" @toggle="toggleVisited" />
    </header>
    <div class="mono-map">
      <WorldMap :projection="projection" :visited="visited" @toggle="toggleVisited" />
    </div>
    <footer class="mono-footer">
      <ProjectionToggle v-model="projection" />
      <ShareControls :projection="projection" :visited="visited" />
    </footer>
  </main>
</template>

<script setup vapor lang="ts">
import { COUNTRY_CODES } from '@/countries'
import CountrySearch from '@/ui/CountrySearch.vue'
import ProjectionToggle from '@/ui/ProjectionToggle.vue'
import ShareControls from '@/ui/ShareControls.vue'
import WorldMap from '@/ui/WorldMap.vue'
import { useTravelMap } from '@/useTravelMap'

const { projection, visited, isVisited, toggleVisited } = useTravelMap()
</script>

<style scoped>
.mono {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  grid-template-columns: minmax(0, 1fr);
  height: 100dvh;
  padding: 24px clamp(16px, 3vw, 40px);
  letter-spacing: -0.01em;
}

.mono-header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  align-items: center;
}

.mono-title {
  margin: 0;
  font-size: 20px;
  font-weight: 650;
  letter-spacing: -0.03em;
}

.mono-count {
  flex: 1;
  margin: 0;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.mono-map {
  min-height: 0;
}

.mono-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

@media (max-width: 600px) {
  .mono-count {
    flex: none;
  }
}
</style>
