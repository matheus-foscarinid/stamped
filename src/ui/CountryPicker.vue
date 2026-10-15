<template>
  <dialog ref="dialog" class="picker control-surface" aria-labelledby="country-picker-title" @close="emit('close')">
    <header class="picker-head">
      <h2 id="country-picker-title" class="picker-title">{{ t('picker.title') }}</h2>
      <button type="button" class="picker-done press-feedback" @click="dialog?.close()">
        {{ t('picker.done') }}
      </button>
    </header>
    <div class="picker-search">
      <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></svg>
      <input
        ref="searchInput"
        :value="query"
        class="picker-search-input"
        type="search"
        enterkeyhint="search"
        autocomplete="off"
        :aria-label="t('search.label')"
        :placeholder="t('search.label')"
        aria-controls="country-picker-list"
        @input="updateQuery"
        @keydown="hideKeyboardOnEnter"
      />
    </div>
    <fieldset class="picker-filters">
      <legend class="visually-hidden">{{ t('picker.show') }}</legend>
      <button
        v-for="option in filterOptions"
        :key="option.filter"
        type="button"
        class="picker-filter press-feedback"
        :aria-pressed="filter === option.filter"
        @click="filter = option.filter"
      >
        {{ option.label }}
        <span v-if="option.count !== null" class="picker-filter-count">{{ option.count }}</span>
      </button>
    </fieldset>
    <div id="country-picker-list" class="picker-list">
      <section v-for="section in sections" :key="section.continent ?? 'results'" class="picker-section">
        <h3 v-if="section.continent" class="picker-section-head">
          <span>{{ t(`continent.${section.continent}`) }}</span>
          <span class="picker-section-count">{{ section.visitedCount }} / {{ section.total }}</span>
        </h3>
        <ul class="picker-rows">
          <li v-for="row in section.rows" :key="row.code">
            <button
              type="button"
              class="picker-row"
              :aria-pressed="row.mark === markMode"
              :data-mark="row.mark"
              :disabled="!row.isPickable"
              @click="pick(row.code)"
            >
              <span class="picker-flag" aria-hidden="true">{{ row.flag }}</span>
              <span class="picker-name">
                {{ row.name }}
                <span v-if="isDisputed(row.code)" class="picker-disputed">{{ t('country.disputed') }}</span>
                <span v-if="row.mark" class="visually-hidden">{{ t(MARK_LABELS[row.mark]) }}</span>
              </span>
              <span class="picker-check" aria-hidden="true">
                <svg v-if="row.mark === 'wishlist'" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z" />
                </svg>
                <svg v-else viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8.5l2.6 2.5L12 5.5" /></svg>
              </span>
            </button>
          </li>
        </ul>
      </section>
      <p v-if="sections.length === 0" class="picker-empty">{{ emptyText }}</p>
    </div>
    <footer class="picker-foot">
      <fieldset class="picker-modes">
        <legend class="picker-foot-label">{{ t('picker.marksAs') }}</legend>
        <div class="picker-mode-track">
          <label v-for="mode in MARK_MODES" :key="mode" class="picker-mode" :data-mode="mode">
            <input
              class="visually-hidden"
              type="radio"
              name="picker-mode"
              :checked="markMode === mode"
              @change="emit('toggleMode')"
            />
            {{ t(MARK_LABELS[mode]) }}
          </label>
        </div>
      </fieldset>
    </footer>
  </dialog>
</template>

<script setup vapor lang="ts">
import { computed, useTemplateRef, watch } from 'vue'
import { type CountryCode, type CountryMark, isDisputed } from '@/countries'
import { useI18n } from '@/i18n/useI18n'
import { type PickerFilter, useCountryPicker } from './useCountryPicker'

const props = defineProps<{
  isOpen: boolean
  markMode: CountryMark
  getMark: (code: CountryCode) => CountryMark | null
  canToggle: (code: CountryCode) => boolean
}>()

const emit = defineEmits<{
  toggle: [code: CountryCode]
  toggleMode: []
  close: []
}>()

const MARK_MODES: CountryMark[] = ['visited', 'wishlist']
const MARK_LABELS = { visited: 'search.visited', wishlist: 'search.wishlist' } as const
const EMPTY_LABELS = { visited: 'picker.noVisited', wishlist: 'picker.noWishlist' } as const

const { t } = useI18n()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const searchInput = useTemplateRef<HTMLInputElement>('searchInput')

const { query, filter, sections, counts, pick, updateQuery } = useCountryPicker({
  getMark: code => props.getMark(code),
  canPick: code => props.canToggle(code),
  onPick: code => emit('toggle', code),
})

const filterOptions = computed(() => [
  { filter: 'all' as PickerFilter, label: t('picker.all'), count: null },
  { filter: 'visited' as PickerFilter, label: t('search.visited'), count: counts.value.visited },
  { filter: 'wishlist' as PickerFilter, label: t('search.wishlist'), count: counts.value.wishlist },
])

const emptyText = computed(() => {
  if (query.value.trim()) return t('picker.noMatches', { query: query.value.trim() })
  return filter.value === 'all' ? '' : t(EMPTY_LABELS[filter.value])
})

// phones keep the keyboard up after a search, which hides half the list
const hideKeyboardOnEnter = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && event.target instanceof HTMLInputElement) event.target.blur()
}

const syncOpen = ([isOpen, element]: readonly [boolean, HTMLDialogElement | null]) => {
  if (!element) return
  if (isOpen && !element.open) {
    query.value = ''
    filter.value = 'all'
    element.showModal()
    // a phone keyboard would cover the list people came to browse, so only a mouse starts typing
    if (window.matchMedia('(hover: hover)').matches) searchInput.value?.focus()
  }
  if (!isOpen && element.open) element.close()
}

watch(() => [props.isOpen, dialog.value] as const, syncOpen, { immediate: true })
</script>

<style scoped>
.picker {
  --picker-gutter: 16px;

  display: none;
  flex-direction: column;
  width: min(560px, calc(100% - 32px));
  height: min(760px, calc(100dvh - 64px));
  max-width: none;
  max-height: none;
  padding: 0;
  overflow: hidden;
  border-radius: var(--radius-menu);
  background: color-mix(in srgb, var(--surface) 94%, transparent);
  transition:
    opacity var(--motion-fast) var(--ease-out),
    scale var(--motion-base) var(--ease-out),
    translate var(--motion-base) var(--ease-out);
}

.picker[open] {
  display: flex;
}

@starting-style {
  .picker[open] {
    opacity: 0;
    scale: 0.97;
  }
}

.picker::backdrop {
  background: rgb(0 0 0 / 0.28);
}

.picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px var(--picker-gutter) 10px calc(var(--picker-gutter) + 4px);
}

.picker-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.picker-done {
  padding: 8px 16px;
  border: 0;
  border-radius: var(--radius-control);
  background: var(--control-active-bg);
  color: var(--control-active-text);
  font-weight: 600;
  cursor: pointer;
}

.picker-search {
  position: relative;
  margin: 0 var(--picker-gutter);
}

.picker-search svg {
  position: absolute;
  top: 50%;
  left: 14px;
  width: 16px;
  height: 16px;
  translate: 0 -50%;
  fill: none;
  stroke: var(--text-muted);
  stroke-width: 1.6;
  stroke-linecap: round;
  pointer-events: none;
}

.picker-search-input {
  width: 100%;
  padding: 12px 16px 12px 38px;
  border: 1px solid var(--glass-line);
  border-radius: var(--radius-control);
  background: var(--control-hover-bg);
  color: var(--text);
  /* 16px stops ios from zooming the page when the field gets focus */
  font: inherit;
  font-size: 16px;
  outline-offset: 2px;
}

.picker-search-input::placeholder {
  color: var(--text-muted);
}

.picker-filters,
.picker-modes {
  min-inline-size: 0;
  margin: 0;
  border: 0;
}

.picker-filters {
  display: flex;
  gap: 8px;
  padding: 12px var(--picker-gutter) 8px;
}

.picker-filter {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 7px 12px;
  border: 1px solid var(--glass-line);
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--ease-out);
}

.picker-filter:hover {
  background: var(--control-hover-bg);
}

.picker-filter[aria-pressed="true"] {
  border-color: transparent;
  background: var(--control-active-bg);
  color: var(--control-active-text);
}

.picker-filter-count {
  font-variant-numeric: tabular-nums;
  opacity: 0.7;
}

.picker-list {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 calc(var(--picker-gutter) - 8px) 12px;
  border-top: 1px solid var(--glass-line);
}

.picker-section-head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  margin: 0;
  padding: 14px 12px 6px;
  background: color-mix(in srgb, var(--surface) 96%, transparent);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
}

.picker-section-count {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.picker-rows {
  margin: 0;
  padding: 0;
  list-style: none;
}

.picker-row {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  min-height: 48px;
  padding: 8px 12px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--text);
  text-align: start;
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--ease-out);
}

.picker-row:hover:enabled,
.picker-row:focus-visible {
  background: var(--control-hover-bg);
}

.picker-row:disabled {
  color: var(--text-muted);
  cursor: default;
}

.picker-flag {
  font-size: 22px;
  line-height: 1;
}

.picker-name {
  flex: 1;
}

.picker-disputed {
  margin-left: 6px;
  color: var(--text-muted);
  font-size: 12px;
}

.picker-check {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 1.5px solid var(--glass-line);
  border-radius: 50%;
  transition:
    background-color var(--motion-fast) var(--ease-out),
    border-color var(--motion-fast) var(--ease-out),
    scale var(--motion-base) var(--ease-out);
}

.picker-check svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
}

.picker-row[data-mark="visited"] .picker-check {
  border-color: transparent;
  background: var(--control-active-bg);
  color: var(--control-active-text);
}

.picker-row[data-mark="wishlist"] .picker-check {
  border-color: var(--map-wishlist);
  background: var(--map-wishlist-soft);
  color: var(--map-wishlist);
}

.picker-row[data-mark="wishlist"] .picker-check svg {
  fill: currentColor;
  stroke-width: 1.2;
}

.picker-row[data-mark] .picker-check svg {
  opacity: 1;
}

.picker-row:active:enabled .picker-check {
  scale: 0.88;
}

.picker-empty {
  margin: 0;
  padding: 40px 12px;
  color: var(--text-muted);
  text-align: center;
}

.picker-foot {
  padding: 10px var(--picker-gutter) calc(10px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--glass-line);
}

.picker-modes {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 0;
}

/* a legend won't sit in a flex row, so it floats to share the line */
.picker-foot-label {
  float: inline-start;
  padding: 0;
  color: var(--text-muted);
  font-size: 14px;
}

.picker-mode-track {
  display: flex;
  margin-inline-start: auto;
  padding: 3px;
  border-radius: var(--radius-control);
  background: var(--control-hover-bg);
}

.picker-mode {
  padding: 7px 14px;
  border: 0;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 550;
  cursor: pointer;
  transition:
    background-color var(--motion-fast) var(--ease-out),
    color var(--motion-fast) var(--ease-out);
}

.picker-mode:has(:focus-visible) {
  outline: 2px solid var(--text);
  outline-offset: 2px;
}

.picker-mode:has(:checked) {
  background: var(--control-active-bg);
  color: var(--control-active-text);
}

.picker-mode[data-mode="wishlist"]:has(:checked) {
  background: var(--map-wishlist-soft);
  box-shadow: inset 0 0 0 1.5px var(--map-wishlist);
  color: var(--text);
}

@media (max-width: 600px) {
  .picker {
    width: 100%;
    height: 100dvh;
    margin: 0;
    border: 0;
    border-radius: 0;
    padding-top: env(safe-area-inset-top);
  }

  @starting-style {
    .picker[open] {
      opacity: 0;
      scale: 1;
      translate: 0 32px;
    }
  }
}
</style>
