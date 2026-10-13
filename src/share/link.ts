import { type CountryCode, isCountryCode } from '@/countries'

// the link is the save file: #v=br,in,jp keeps a map without accounts or storage
const VISITED_PARAM = 'v'

// unknown or repeated codes are dropped, so a hand-edited or outdated link still opens
export const readVisitedFromHash = (hash: string): CountryCode[] => {
  const value = new URLSearchParams(hash.replace(/^#/, '')).get(VISITED_PARAM) ?? ''
  const codes = value
    .split(',')
    .map(code => code.trim().toLowerCase())
    .filter(isCountryCode)
  return [...new Set(codes)]
}

// commas stay readable instead of becoming %2C, since codes never contain them
export const writeVisitedToHash = (codes: readonly CountryCode[]): string =>
  codes.length === 0 ? '' : `#${VISITED_PARAM}=${codes.join(',')}`
