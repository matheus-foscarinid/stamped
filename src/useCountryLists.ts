import { onScopeDispose, type Ref, shallowRef, watch } from 'vue'
import { bindAccountLists, syncCountryLists } from '@/account/account'
import { type CountryCode, type CountryLists, isSameLists, keepVisitWins } from '@/countries'
import {
  readCountryList,
  readListsFromHash,
  updateAddressBarHash,
  writeListsToHash,
} from '@/share/link'
import { readStorage, writeStorage } from '@/storage'

const STORAGE_KEYS: Record<keyof CountryLists, string> = {
  visited: 'stamped-visited',
  wishlist: 'stamped-wishlist',
}

interface UseCountryListsResult {
  lists: Readonly<Ref<CountryLists>>
  setLists: (lists: CountryLists) => void
}

const readSavedList = (key: string): CountryCode[] => readCountryList(readStorage(key) ?? '')

// if storage is blocked the link is the only copy
const saveLists = (lists: CountryLists) => {
  writeStorage(STORAGE_KEYS.visited, lists.visited.join(','))
  writeStorage(STORAGE_KEYS.wishlist, lists.wishlist.join(','))
}

const hasCountries = (lists: CountryLists) => lists.visited.length + lists.wishlist.length > 0

const readSavedLists = (): CountryLists =>
  keepVisitWins({
    visited: readSavedList(STORAGE_KEYS.visited),
    wishlist: readSavedList(STORAGE_KEYS.wishlist),
  })

export const hasSavedMap = (): boolean => hasCountries(readSavedLists())

interface StartingLists {
  lists: CountryLists
  isFriendsLink: boolean
}

// a link always wins, so opening someone's map shows theirs
const readStartingLists = (): StartingLists => {
  const linked = readListsFromHash(window.location.hash)
  const saved = readSavedLists()
  if (!hasCountries(linked)) return { lists: saved, isFriendsLink: false }
  return { lists: linked, isFriendsLink: !isSameLists(linked, saved) }
}

const writeListsToAddressBar = (lists: CountryLists) =>
  updateAddressBarHash(hash => writeListsToHash(hash, lists))

// only edits are saved, so viewing a friend's link never overwrites your own map
export const useCountryLists = (): UseCountryListsResult => {
  const starting = readStartingLists()
  const lists = shallowRef<CountryLists>(starting.lists)
  // immediate so the link is ready before anyone copies it
  watch(lists, writeListsToAddressBar, { immediate: true })

  const followPastedLink = () => {
    lists.value = readListsFromHash(window.location.hash)
  }
  window.addEventListener('hashchange', followPastedLink)
  onScopeDispose(() => window.removeEventListener('hashchange', followPastedLink))

  const showLists = (next: CountryLists) => {
    lists.value = next
    saveLists(next)
  }

  const setLists = (next: CountryLists) => {
    showLists(next)
    syncCountryLists(next)
  }

  onScopeDispose(
    bindAccountLists({
      read: () => lists.value,
      show: showLists,
      isFriendsLink: starting.isFriendsLink,
    })
  )

  return { lists, setLists }
}
