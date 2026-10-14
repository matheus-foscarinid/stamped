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

// visiting a wished country fulfils the wish, so it leaves the wishlist
export const toggleVisited = (lists: CountryLists, code: CountryCode): CountryLists => {
  if (lists.visited.includes(code)) return { ...lists, visited: without(lists.visited, code) }
  return { visited: [...lists.visited, code], wishlist: without(lists.wishlist, code) }
}

// a visited country can't be wished for, so a stray tap never removes a visit
export const toggleWishlisted = (lists: CountryLists, code: CountryCode): CountryLists => {
  if (lists.visited.includes(code)) return lists
  if (lists.wishlist.includes(code)) return { ...lists, wishlist: without(lists.wishlist, code) }
  return { ...lists, wishlist: [...lists.wishlist, code] }
}
