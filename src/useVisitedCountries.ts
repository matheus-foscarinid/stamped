import { onScopeDispose, type Ref, ref, watch } from 'vue'
import type { CountryCode } from '@/countries'
import { readCountryList, readVisitedFromHash, writeVisitedToHash } from '@/share/link'

const VISITED_STORAGE_KEY = 'stamped-visited'

interface UseVisitedCountriesResult {
  visited: Readonly<Ref<readonly CountryCode[]>>
  setVisited: (codes: readonly CountryCode[]) => void
}

const readSavedVisited = (): CountryCode[] => {
  try {
    return readCountryList(localStorage.getItem(VISITED_STORAGE_KEY) ?? '')
  } catch {
    return []
  }
}

const saveVisited = (codes: readonly CountryCode[]) => {
  try {
    localStorage.setItem(VISITED_STORAGE_KEY, codes.join(','))
  } catch {
    // blocked storage keeps the map in the link only
  }
}

// a link always wins, so opening someone's map shows theirs
const readStartingVisited = (): CountryCode[] => {
  const linked = readVisitedFromHash(window.location.hash)
  return linked.length > 0 ? linked : readSavedVisited()
}

const writeVisitedToAddressBar = (codes: readonly CountryCode[]) => {
  const { pathname, search } = window.location
  // replace, not push, so toggles don't flood the back button
  history.replaceState(null, '', `${pathname}${search}${writeVisitedToHash(codes)}`)
}

// only edits are saved, so viewing a friend's link never overwrites your own map
export const useVisitedCountries = (): UseVisitedCountriesResult => {
  const visited = ref<readonly CountryCode[]>(readStartingVisited())
  // immediate, so a map restored from storage is in the link before anyone copies it
  watch(visited, writeVisitedToAddressBar, { immediate: true })

  const followPastedLink = () => {
    visited.value = readVisitedFromHash(window.location.hash)
  }
  window.addEventListener('hashchange', followPastedLink)
  onScopeDispose(() => window.removeEventListener('hashchange', followPastedLink))

  const setVisited = (codes: readonly CountryCode[]) => {
    visited.value = codes
    saveVisited(codes)
  }

  return { visited, setVisited }
}
