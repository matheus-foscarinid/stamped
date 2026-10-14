import { onScopeDispose, type Ref, ref, watch } from 'vue'
import type { CountryCode, CountryLists } from '@/countries'
import { readCountryList, readListsFromHash, writeListsToHash } from '@/share/link'

const STORAGE_KEYS: Record<keyof CountryLists, string> = {
  visited: 'stamped-visited',
  wishlist: 'stamped-wishlist',
}

interface UseCountryListsResult {
  lists: Readonly<Ref<CountryLists>>
  setLists: (lists: CountryLists) => void
}

const readSavedList = (key: string): CountryCode[] => {
  try {
    return readCountryList(localStorage.getItem(key) ?? '')
  } catch {
    return []
  }
}

const saveLists = (lists: CountryLists) => {
  try {
    localStorage.setItem(STORAGE_KEYS.visited, lists.visited.join(','))
    localStorage.setItem(STORAGE_KEYS.wishlist, lists.wishlist.join(','))
  } catch {
    // blocked storage keeps the map in the link only
  }
}

const hasCountries = (lists: CountryLists) => lists.visited.length + lists.wishlist.length > 0

// a link always wins, so opening someone's map shows theirs
const readStartingLists = (): CountryLists => {
  const linked = readListsFromHash(window.location.hash)
  if (hasCountries(linked)) return linked
  return {
    visited: readSavedList(STORAGE_KEYS.visited),
    wishlist: readSavedList(STORAGE_KEYS.wishlist),
  }
}

const writeListsToAddressBar = (lists: CountryLists) => {
  const { pathname, search } = window.location
  // replace, not push, so toggles don't flood the back button
  history.replaceState(null, '', `${pathname}${search}${writeListsToHash(lists)}`)
}

// only edits are saved, so viewing a friend's link never overwrites your own map
export const useCountryLists = (): UseCountryListsResult => {
  const lists = ref<CountryLists>(readStartingLists())
  // immediate, so a map restored from storage is in the link before anyone copies it
  watch(lists, writeListsToAddressBar, { immediate: true })

  const followPastedLink = () => {
    lists.value = readListsFromHash(window.location.hash)
  }
  window.addEventListener('hashchange', followPastedLink)
  onScopeDispose(() => window.removeEventListener('hashchange', followPastedLink))

  const setLists = (next: CountryLists) => {
    lists.value = next
    saveLists(next)
  }

  return { lists, setLists }
}
