<template>
  <div class="country-search">
    <label class="visually-hidden" for="country-search-input">{{ searchLabel }}</label>
    <input
      id="country-search-input"
      :value="query"
      class="country-search-input control-surface"
      type="search"
      autocomplete="off"
      :placeholder="searchLabel"
      aria-describedby="country-search-status"
      @input="updateQuery"
      @keydown="pickOnEnter"
    />
    <button
      type="button"
      class="wishlist-mode press-feedback"
      :aria-pressed="isWishlistMode"
      :aria-label="t('search.wishlistMode')"
      :title="t('search.wishlistMode')"
      @click="emit('toggleMode')"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z" />
      </svg>
    </button>
    <p id="country-search-status" class="visually-hidden" aria-live="polite">
      {{ query ? t('search.status', { count: matches.length }) : '' }}
    </p>
    <ul v-show="matches.length > 0" class="country-search-results control-surface">
      <li v-for="match in matches" :key="match.code">
        <button
          type="button"
          class="country-option"
          :aria-pressed="getMark(match.code) === activeMark"
          :disabled="isWishlistMode && getMark(match.code) === 'visited'"
          @click="pick(match.code)"
        >
          <span class="country-flag" aria-hidden="true">{{ match.flag }}</span>
          <span class="country-name">
            {{ match.name }}
            <span v-if="isDisputed(match.code)" class="country-disputed">{{ t('country.disputed') }}</span>
          </span>
          <span v-if="getMark(match.code)" class="country-mark" :data-mark="getMark(match.code)">
            {{ t(MARK_LABELS[getMark(match.code) ?? 'visited']) }}
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup vapor lang="ts">
import { computed } from 'vue'
import { type CountryCode, type CountryMark, isDisputed } from '@/countries'
import { useI18n } from '@/i18n/useI18n'
import { useCountrySearch } from './useCountrySearch'

const props = defineProps<{
  getMark: (code: CountryCode) => CountryMark | null
  isWishlistMode: boolean
}>()

const emit = defineEmits<{
  toggle: [code: CountryCode]
  toggleMode: []
}>()

const MARK_LABELS = { visited: 'search.visited', wishlist: 'search.wishlist' } as const

const { t } = useI18n()
const activeMark = computed<CountryMark>(() => (props.isWishlistMode ? 'wishlist' : 'visited'))
const searchLabel = computed(() => t(props.isWishlistMode ? 'search.wishlistLabel' : 'search.label'))

const { query, matches, pick, updateQuery, pickOnEnter } = useCountrySearch({
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
  padding: 11px 50px 11px 18px;
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

.wishlist-mode {
  position: absolute;
  inset: 5px 5px 5px auto;
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    background-color var(--motion-fast) var(--ease-out),
    color var(--motion-fast) var(--ease-out);
}

.wishlist-mode:hover {
  background: var(--control-hover-bg);
  color: var(--text);
}

.wishlist-mode[aria-pressed="true"] {
  background: var(--control-active-bg);
  color: var(--control-active-text);
}

.wishlist-mode svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linejoin: round;
}

.wishlist-mode[aria-pressed="true"] svg {
  fill: currentColor;
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

.country-option:hover:enabled,
.country-option:focus-visible {
  background: var(--control-hover-bg);
}

.country-option:disabled {
  color: var(--text-muted);
  cursor: default;
}

.country-name {
  flex: 1;
}

.country-disputed {
  margin-left: 6px;
  color: var(--text-muted);
  font-size: 12px;
}

.country-mark {
  padding: 2px 8px;
  border-radius: var(--radius-control);
  background: var(--control-active-bg);
  color: var(--control-active-text);
  font-size: 12px;
  font-weight: 600;
}

.country-mark[data-mark="wishlist"] {
  background: transparent;
  box-shadow: inset 0 0 0 1.5px var(--control-active-bg);
  color: var(--text);
}
</style>
