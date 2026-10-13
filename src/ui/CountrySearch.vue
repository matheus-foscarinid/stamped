<template>
  <div class="country-search">
    <label class="visually-hidden" for="country-search-input">Search countries</label>
    <input
      id="country-search-input"
      v-model="query"
      class="country-search-input control-surface"
      type="search"
      autocomplete="off"
      placeholder="Search countries"
      aria-describedby="country-search-status"
      @keydown.enter.prevent="pickTopMatch"
    />
    <p id="country-search-status" class="visually-hidden" aria-live="polite">
      {{ query ? `${matches.length} matching countries` : '' }}
    </p>
    <ul v-show="matches.length > 0" class="country-search-results control-surface">
      <li v-for="match in matches" :key="match.code">
        <button
          type="button"
          class="country-option"
          :aria-pressed="isVisited(match.code)"
          @click="pick(match.code)"
        >
          <span class="country-flag" aria-hidden="true">{{ match.flag }}</span>
          <span class="country-name">{{ match.name }}</span>
          <span v-if="isVisited(match.code)" class="country-visited">Visited</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup vapor lang="ts">
import type { CountryCode } from '@/countries'
import { useCountrySearch } from './useCountrySearch'

defineProps<{
  isVisited: (code: CountryCode) => boolean
}>()

const emit = defineEmits<{
  toggle: [code: CountryCode]
}>()

const { query, matches, pick, pickTopMatch } = useCountrySearch({
  onPick: code => emit('toggle', code),
})
</script>

<style scoped>
.country-search {
  position: relative;
  width: min(360px, 100%);
}

.country-search-input {
  width: 100%;
  padding: 10px 16px;
  border-radius: var(--radius-control);
  font: inherit;
}

.country-search-results {
  position: absolute;
  z-index: 1;
  inset: calc(100% + 6px) 0 auto;
  margin: 0;
  padding: 6px;
  list-style: none;
  border-radius: var(--radius-menu);
}

.country-option {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: start;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px 10px;
  border-radius: calc(var(--radius-menu) - 6px);
  cursor: pointer;
}

.country-option:hover,
.country-option:focus-visible {
  background: var(--control-hover-bg);
}

.country-name {
  flex: 1;
}

.country-visited {
  color: var(--accent);
  font-size: 13px;
}
</style>
