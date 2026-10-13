<template>
  <main class="page">
    <section class="card">
      <ProjectionToggle v-model="projection" />
      <WorldMap :projection="projection" :visited="NO_VISITED" />
    </section>
  </main>
</template>

<script setup vapor lang="ts">
import { ref } from 'vue'
import type { ProjectionId } from '@/map'
import ProjectionToggle from '@/ui/ProjectionToggle.vue'
import WorldMap from '@/ui/WorldMap.vue'

const NO_VISITED: readonly string[] = []

const projection = ref<ProjectionId>('equal-earth')
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
</style>
