import { type ComputedRef, computed, type Ref, ref } from 'vue'
import { type CountryCode, type CountryMatch, searchCountries } from '@/countries'

interface UseCountrySearchInput {
  onPick: (code: CountryCode) => void
}

interface UseCountrySearchResult {
  query: Ref<string>
  matches: ComputedRef<CountryMatch[]>
  pick: (code: CountryCode) => void
  updateQuery: (event: Event) => void
  pickOnEnter: (event: KeyboardEvent) => void
}

export const useCountrySearch = ({ onPick }: UseCountrySearchInput): UseCountrySearchResult => {
  const query = ref('')
  const matches = computed(() => searchCountries(query.value))

  const pick = (code: CountryCode) => {
    onPick(code)
    query.value = ''
  }

  const updateQuery = (event: Event) => {
    if (event.target instanceof HTMLInputElement) query.value = event.target.value
  }

  const pickOnEnter = (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const [topMatch] = matches.value
    if (topMatch) pick(topMatch.code)
  }

  return { query, matches, pick, updateQuery, pickOnEnter }
}
