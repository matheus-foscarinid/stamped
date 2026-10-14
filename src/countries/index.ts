import { COUNTRY_CODES, type CountryCode } from './catalog.ts'

export { COUNTRY_CODES, type CountryCode } from './catalog.ts'
export { getCountryHue, hashCountryCode } from './colors.ts'
export { groupByContinent } from './continents.ts'
export { isDisputed } from './disputed.ts'
export { getFlagEmoji } from './flags.ts'
export {
  type CountryLists,
  type CountryMark,
  canToggleMark,
  EMPTY_LISTS,
  getCountryMark,
  keepVisitWins,
  toggleMark,
} from './lists.ts'
export { getCountryName } from './names.ts'
export { getContinent } from './regions.ts'
export { type CountryMatch, searchCountries } from './search.ts'
export { getTravelStats } from './stats.ts'

const COUNTRY_CODE_SET: ReadonlySet<string> = new Set(COUNTRY_CODES)

export const isCountryCode = (value: string): value is CountryCode => COUNTRY_CODE_SET.has(value)
