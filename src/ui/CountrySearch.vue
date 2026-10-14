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
    <WishlistModeToggle
      class="country-search-mode"
      :is-pressed="markMode === 'wishlist'"
      @toggle="emit('toggleMode')"
    />
    <p id="country-search-status" class="visually-hidden" aria-live="polite">
      {{ query ? t('search.status', { count: matches.length }) : '' }}
    </p>
    <ul v-show="matches.length > 0" class="country-search-results control-surface">
      <li v-for="match in matches" :key="match.code">
        <button
          type="button"
          class="country-option"
          :aria-pressed="match.mark === markMode"
          :disabled="!match.isPickable"
          @click="pick(match.code)"
        >
          <span class="country-flag" aria-hidden="true">{{ match.flag }}</span>
          <span class="country-name">
            {{ match.name }}
            <span v-if="isDisputed(match.code)" class="country-disputed">{{ t('country.disputed') }}</span>
          </span>
          <span v-if="match.mark" class="country-mark" :data-mark="match.mark">
            {{ t(MARK_LABELS[match.mark]) }}
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
import WishlistModeToggle from './WishlistModeToggle.vue'

const props = defineProps<{
  markMode: CountryMark
  getMark: (code: CountryCode) => CountryMark | null
  canToggle: (code: CountryCode) => boolean
}>()

const emit = defineEmits<{
  toggle: [code: CountryCode]
  toggleMode: []
}>()

const MARK_LABELS = { visited: 'search.visited', wishlist: 'search.wishlist' } as const

const { t } = useI18n()
const SEARCH_LABELS = { visited: 'search.label', wishlist: 'search.wishlistLabel' } as const
const searchLabel = computed(() => t(SEARCH_LABELS[props.markMode]))

const { query, matches, pick, updateQuery, pickOnEnter } = useCountrySearch({
  getMark: code => props.getMark(code),
  canPick: code => props.canToggle(code),
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

.country-search-mode {
  position: absolute;
  inset: 5px 5px 5px auto;
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
