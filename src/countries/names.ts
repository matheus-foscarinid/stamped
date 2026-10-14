import type { CountryCode } from './catalog.ts'

const regionNamesByLocale = new Map<string, Intl.DisplayNames>()

export const getCountryName = (code: CountryCode, locale: string): string => {
  let regionNames = regionNamesByLocale.get(locale)
  if (!regionNames) {
    regionNames = new Intl.DisplayNames([locale], { type: 'region' })
    regionNamesByLocale.set(locale, regionNames)
  }
  const upperCode = code.toUpperCase()
  return regionNames.of(upperCode) ?? upperCode
}
