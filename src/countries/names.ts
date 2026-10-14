import type { CountryCode } from './catalog.ts'

// the browser has no names for our private-use codes
const UNLISTED_NAMES: Partial<Record<CountryCode, Record<string, string>>> = {
  xn: {
    de: 'Nordzypern',
    en: 'Northern Cyprus',
    es: 'Chipre del Norte',
    fr: 'Chypre du Nord',
    it: 'Cipro del Nord',
    pt: 'Chipre do Norte',
  },
  xs: {
    de: 'Somaliland',
    en: 'Somaliland',
    es: 'Somalilandia',
    fr: 'Somaliland',
    it: 'Somaliland',
    pt: 'Somalilândia',
  },
}

const regionNamesByLocale = new Map<string, Intl.DisplayNames>()

const getRegionNames = (locale: string): Intl.DisplayNames => {
  let regionNames = regionNamesByLocale.get(locale)
  if (!regionNames) {
    regionNames = new Intl.DisplayNames([locale], { type: 'region' })
    regionNamesByLocale.set(locale, regionNames)
  }
  return regionNames
}

export const getCountryName = (code: CountryCode, locale: string): string => {
  const unlisted = UNLISTED_NAMES[code]
  if (unlisted) return unlisted[locale] ?? unlisted.en ?? code
  const upperCode = code.toUpperCase()
  return getRegionNames(locale).of(upperCode) ?? upperCode
}
