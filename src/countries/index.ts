import { COUNTRY_CODES, type CountryCode } from './catalog.ts'

export { COUNTRY_CODES, type CountryCode } from './catalog.ts'
export { getFlagEmoji } from './flags.ts'
export { getCountryName } from './names.ts'
export { type CountryMatch, searchCountries } from './search.ts'
export { formatWorldShare, getTravelStats } from './stats.ts'

const COUNTRY_CODE_SET: ReadonlySet<string> = new Set(COUNTRY_CODES)

export const isCountryCode = (value: string): value is CountryCode => COUNTRY_CODE_SET.has(value)
