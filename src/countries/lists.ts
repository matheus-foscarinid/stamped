import type { CountryCode } from './catalog.ts'

export type CountryMark = 'visited' | 'wishlist'

export interface CountryLists {
  visited: readonly CountryCode[]
  wishlist: readonly CountryCode[]
}

export const EMPTY_LISTS: CountryLists = { visited: [], wishlist: [] }

const without = (codes: readonly CountryCode[], code: CountryCode) =>
  codes.filter(listed => listed !== code)

export const getCountryMark = (lists: CountryLists, code: CountryCode): CountryMark | null => {
  if (lists.visited.includes(code)) return 'visited'
  if (lists.wishlist.includes(code)) return 'wishlist'
  return null
}

// a visited country can't be wished for, so a stray tap never removes a visit
export const canToggleMark = (lists: CountryLists, code: CountryCode, mark: CountryMark) =>
  mark === 'visited' || !lists.visited.includes(code)

// a country is on one list at most. links and storage can disagree, the visit wins
export const keepVisitWins = ({ visited, wishlist }: CountryLists): CountryLists => ({
  visited,
  wishlist: wishlist.filter(code => !visited.includes(code)),
})

const toggleVisited = (lists: CountryLists, code: CountryCode): CountryLists => {
  if (lists.visited.includes(code)) return { ...lists, visited: without(lists.visited, code) }
  // a visit fulfils the wish
  return { visited: [...lists.visited, code], wishlist: without(lists.wishlist, code) }
}

const toggleWishlisted = (lists: CountryLists, code: CountryCode): CountryLists => {
  if (lists.wishlist.includes(code)) return { ...lists, wishlist: without(lists.wishlist, code) }
  return { ...lists, wishlist: [...lists.wishlist, code] }
}

export const toggleMark = (lists: CountryLists, code: CountryCode, mark: CountryMark) => {
  if (!canToggleMark(lists, code, mark)) return lists
  return mark === 'visited' ? toggleVisited(lists, code) : toggleWishlisted(lists, code)
}
