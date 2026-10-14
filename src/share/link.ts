import { type CountryCode, type CountryLists, isCountryCode } from '@/countries'

// e.g. #v=br,in,jp&w=is,nz
const LIST_PARAMS: Record<keyof CountryLists, string> = { visited: 'v', wishlist: 'w' }

// tolerate hand-edited or outdated lists
export const readCountryList = (value: string): CountryCode[] => {
  const codes = value
    .split(',')
    .map(code => code.trim().toLowerCase())
    .filter(isCountryCode)
  return [...new Set(codes)]
}

export const readListsFromHash = (hash: string): CountryLists => {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const visited = readCountryList(params.get(LIST_PARAMS.visited) ?? '')
  const wishlist = readCountryList(params.get(LIST_PARAMS.wishlist) ?? '')
  // a hand-edited link can list a country twice. the visit wins
  return { visited, wishlist: wishlist.filter(code => !visited.includes(code)) }
}

// commas stay readable instead of becoming %2C, since codes never contain them
export const writeListsToHash = (lists: CountryLists): string => {
  const params = (Object.keys(LIST_PARAMS) as (keyof CountryLists)[])
    .filter(list => lists[list].length > 0)
    .map(list => `${LIST_PARAMS[list]}=${lists[list].join(',')}`)
  return params.length === 0 ? '' : `#${params.join('&')}`
}
