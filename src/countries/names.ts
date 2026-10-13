import type { CountryCode } from './catalog.ts'

const DISPLAY_LOCALE = 'en'

const regionNames = new Intl.DisplayNames([DISPLAY_LOCALE], { type: 'region' })

export const getCountryName = (code: CountryCode): string => {
  const upperCode = code.toUpperCase()
  return regionNames.of(upperCode) ?? upperCode
}
