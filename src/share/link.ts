import { type CountryCode, isCountryCode } from '@/countries'

// the url is the only storage, e.g. #v=br,in,jp
const VISITED_PARAM = 'v'

// tolerate hand-edited or outdated links
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
