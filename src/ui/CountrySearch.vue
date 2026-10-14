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
  width: min(340px, 100%);
}

.country-search-input {
  width: 100%;
  padding: 11px 18px;
  border-radius: var(--radius-control);
  font: inherit;
  outline-offset: 3px;
  transition: background-color var(--motion-fast) var(--ease-out);
}

.country-search-input::placeholder {
  color: var(--text-muted);
}

.country-search-input:focus {
  background: var(--glass-hover);
}

.country-search-results {
  position: absolute;
  z-index: 1;
  inset: calc(100% + 8px) 0 auto;
  margin: 0;
  padding: 6px;
  list-style: none;
  border-radius: var(--radius-menu);
  transform-origin: top center;
  transition:
    opacity var(--motion-fast) var(--ease-out),
    transform var(--motion-base) var(--ease-out);
}

@starting-style {
  .country-search-results {
    opacity: 0;
    transform: translateY(-6px) scale(0.98);
  }
}

.country-option {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: start;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 9px 12px;
  border-radius: calc(var(--radius-menu) - 6px);
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--ease-out);
}

.country-option:hover,
.country-option:focus-visible {
  background: var(--control-hover-bg);
}

.country-name {
  flex: 1;
}

.country-visited {
  padding: 2px 8px;
  border-radius: var(--radius-control);
  background: var(--control-active-bg);
  color: var(--control-active-text);
  font-size: 12px;
  font-weight: 600;
}
</style>
