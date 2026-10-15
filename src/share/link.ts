import { type CountryCode, type CountryLists, isCountryCode, keepVisitWins } from '@/countries'

// e.g. #v=br,in,jp&w=is,nz&t=dracula
const LIST_PARAMS: Record<keyof CountryLists, string> = { visited: 'v', wishlist: 'w' }
const LIST_NAMES = Object.keys(LIST_PARAMS) as (keyof CountryLists)[]

export const readHashParams = (hash: string) => new URLSearchParams(hash.replace(/^#/, ''))

// commas stay readable instead of becoming %2C, since codes never contain them
export const writeHashParams = (params: URLSearchParams): string => {
  const query = params.toString().replaceAll('%2C', ',')
  return query === '' ? '' : `#${query}`
}

// tolerate hand-edited or outdated lists
export const readCountryList = (value: string): CountryCode[] => {
  const codes = value
    .split(',')
    .map(code => code.trim().toLowerCase())
    .filter(isCountryCode)
  return [...new Set(codes)]
}

export const readListsFromHash = (hash: string): CountryLists => {
  const params = readHashParams(hash)
  return keepVisitWins({
    visited: readCountryList(params.get(LIST_PARAMS.visited) ?? ''),
    wishlist: readCountryList(params.get(LIST_PARAMS.wishlist) ?? ''),
  })
}

// each writer only touches its own params, so the lists and the theme share one link
export const writeListsToHash = (hash: string, lists: CountryLists): string => {
  const params = readHashParams(hash)
  for (const list of LIST_NAMES) {
    if (lists[list].length > 0) params.set(LIST_PARAMS[list], lists[list].join(','))
    else params.delete(LIST_PARAMS[list])
  }
  return writeHashParams(params)
}

// replace, not push, so edits don't flood the back button
export const updateAddressBarHash = (writeHash: (hash: string) => string) => {
  const { pathname, search, hash } = window.location
  history.replaceState(null, '', `${pathname}${search}${writeHash(hash)}`)
}
