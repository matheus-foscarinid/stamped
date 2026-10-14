import { onScopeDispose, type Ref, shallowRef, watch } from 'vue'
import { type CountryCode, type CountryLists, keepVisitWins } from '@/countries'
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
    // the link is the only copy then
  }
}

const hasCountries = (lists: CountryLists) => lists.visited.length + lists.wishlist.length > 0

const readSavedLists = (): CountryLists =>
  keepVisitWins({
    visited: readSavedList(STORAGE_KEYS.visited),
    wishlist: readSavedList(STORAGE_KEYS.wishlist),
  })

export const hasSavedMap = (): boolean => hasCountries(readSavedLists())

// a link always wins, so opening someone's map shows theirs
const readStartingLists = (): CountryLists => {
  const linked = readListsFromHash(window.location.hash)
  return hasCountries(linked) ? linked : readSavedLists()
}

const writeListsToAddressBar = (lists: CountryLists) => {
  const { pathname, search } = window.location
  // replace, not push, so toggles don't flood the back button
  history.replaceState(null, '', `${pathname}${search}${writeListsToHash(lists)}`)
}

// only edits are saved, so viewing a friend's link never overwrites your own map
export const useCountryLists = (): UseCountryListsResult => {
  const lists = shallowRef<CountryLists>(readStartingLists())
  // immediate so the link is ready before anyone copies it
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
