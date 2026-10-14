import { type ComputedRef, computed, type Ref, ref } from 'vue'
import { type CountryCode, type CountryMark, type CountryMatch, searchCountries } from '@/countries'
import { useI18n } from '@/i18n/useI18n'

interface UseCountrySearchInput {
  getMark: (code: CountryCode) => CountryMark | null
  canPick: (code: CountryCode) => boolean
  onPick: (code: CountryCode) => void
}

interface SearchRow extends CountryMatch {
  mark: CountryMark | null
  isPickable: boolean
}

interface UseCountrySearchResult {
  query: Ref<string>
  matches: ComputedRef<SearchRow[]>
  pick: (code: CountryCode) => void
  updateQuery: (event: Event) => void
  pickOnEnter: (event: KeyboardEvent) => void
}

export const useCountrySearch = (input: UseCountrySearchInput): UseCountrySearchResult => {
  const query = ref('')
  const { language } = useI18n()
  const matches = computed(() =>
    searchCountries(query.value, { locale: language.value }).map(match => ({
      ...match,
      mark: input.getMark(match.code),
      isPickable: input.canPick(match.code),
    }))
  )

  const pick = (code: CountryCode) => {
    input.onPick(code)
    query.value = ''
  }

  const updateQuery = (event: Event) => {
    if (event.target instanceof HTMLInputElement) query.value = event.target.value
  }

  const pickOnEnter = (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    // skips rows this mode can't change, so enter never clears the query for nothing
    const topMatch = matches.value.find(match => match.isPickable)
    if (topMatch) pick(topMatch.code)
  }

  return { query, matches, pick, updateQuery, pickOnEnter }
}
