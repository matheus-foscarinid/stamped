import { type ComputedRef, computed, type Ref, ref } from 'vue'
import { type CountryCode, type CountryMatch, searchCountries } from '@/countries'

interface UseCountrySearchInput {
  onPick: (code: CountryCode) => void
}

interface UseCountrySearchResult {
  query: Ref<string>
  matches: ComputedRef<CountryMatch[]>
  pick: (code: CountryCode) => void
  pickTopMatch: () => void
}

export const useCountrySearch = ({ onPick }: UseCountrySearchInput): UseCountrySearchResult => {
  const query = ref('')
  const matches = computed(() => searchCountries(query.value))

  const pick = (code: CountryCode) => {
    onPick(code)
    query.value = ''
  }

  const pickTopMatch = () => {
    const [topMatch] = matches.value
    if (topMatch) pick(topMatch.code)
  }

  return { query, matches, pick, pickTopMatch }
}
