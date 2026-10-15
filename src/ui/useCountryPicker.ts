import { type ComputedRef, computed, type Ref, ref } from 'vue'
import {
  COUNTRY_CODES,
  type Continent,
  type CountryCode,
  type CountryMark,
  type CountryMatch,
  getCountryName,
  getFlagEmoji,
  groupByContinent,
  searchCountries,
} from '@/countries'
import { useI18n } from '@/i18n/useI18n'

export type PickerFilter = 'all' | CountryMark

interface UseCountryPickerInput {
  getMark: (code: CountryCode) => CountryMark | null
  canPick: (code: CountryCode) => boolean
  onPick: (code: CountryCode) => void
}

interface PickerRow extends CountryMatch {
  mark: CountryMark | null
  isPickable: boolean
}

interface PickerSection {
  // null for search results, which come ranked instead of by continent
  continent: Continent | null
  rows: PickerRow[]
  visitedCount: number
  total: number
}

interface UseCountryPickerResult {
  query: Ref<string>
  filter: Ref<PickerFilter>
  sections: ComputedRef<PickerSection[]>
  counts: ComputedRef<Record<CountryMark, number>>
  pick: (code: CountryCode) => void
  updateQuery: (event: Event) => void
}

const countMarked = (rows: readonly PickerRow[], mark: CountryMark) =>
  rows.filter(row => row.mark === mark).length

export const useCountryPicker = (input: UseCountryPickerInput): UseCountryPickerResult => {
  const query = ref('')
  const filter = ref<PickerFilter>('all')
  const { language } = useI18n()

  const toRow = (match: CountryMatch): PickerRow => ({
    ...match,
    mark: input.getMark(match.code),
    isPickable: input.canPick(match.code),
  })
  const toMatch = (code: CountryCode): CountryMatch => ({
    code,
    name: getCountryName(code, language.value),
    flag: getFlagEmoji(code),
  })
  const isShown = (row: PickerRow) => filter.value === 'all' || row.mark === filter.value

  const continentSections = (): PickerSection[] =>
    groupByContinent(COUNTRY_CODES, language.value).map(group => {
      const rows = group.codes.map(code => toRow(toMatch(code)))
      return {
        continent: group.continent,
        rows,
        visitedCount: countMarked(rows, 'visited'),
        total: group.total,
      }
    })

  const searchSection = (): PickerSection => {
    const matches = searchCountries(query.value, { locale: language.value, limit: Infinity })
    const rows = matches.map(toRow)
    return { continent: null, rows, visitedCount: countMarked(rows, 'visited'), total: rows.length }
  }

  const sections = computed(() => {
    const unfiltered = query.value.trim() ? [searchSection()] : continentSections()
    return unfiltered
      .map(section => ({ ...section, rows: section.rows.filter(isShown) }))
      .filter(section => section.rows.length > 0)
  })

  const counts = computed(() => {
    const marks = COUNTRY_CODES.map(input.getMark)
    return {
      visited: marks.filter(mark => mark === 'visited').length,
      wishlist: marks.filter(mark => mark === 'wishlist').length,
    }
  })

  // the query stays, so one search can stamp several countries in a row
  const pick = (code: CountryCode) => input.onPick(code)

  const updateQuery = (event: Event) => {
    if (event.target instanceof HTMLInputElement) query.value = event.target.value
  }

  return { query, filter, sections, counts, pick, updateQuery }
}
