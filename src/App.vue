<template>
  <main class="page">
    <section class="card">
      <header class="card-header">
        <CountrySearch :is-visited="isVisited" @toggle="toggleVisited" />
        <p class="visited-count">{{ visited.length }} of {{ COUNTRY_CODES.length }} countries</p>
      </header>
      <div class="map-frame">
        <WorldMap :projection="projection" :visited="visited" @toggle="toggleVisited" />
      </div>
      <ProjectionToggle v-model="projection" />
      <ShareControls :projection="projection" :visited="visited" />
    </section>
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
.page {
  display: grid;
  place-items: center;
  min-height: 100dvh;
  padding: 24px 16px;
}

.card {
  display: grid;
  gap: 20px;
  justify-items: center;
  width: min(1100px, 100%);
  padding: 24px;
  border-radius: var(--radius-card);
  background: var(--surface);
}

.card-header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.map-frame {
  width: 100%;
  aspect-ratio: 2 / 1;
  overflow: hidden;
  border-radius: 20px;
}

.visited-count {
  margin: 0;
  color: var(--text-muted);
}
</style>
