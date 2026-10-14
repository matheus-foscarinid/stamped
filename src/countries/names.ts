import type { CountryCode } from './catalog.ts'

// the browser has no names for our private-use codes
const UNLISTED_NAMES: Partial<Record<CountryCode, Record<string, string>>> = {
  xa: {
    de: 'Abchasien',
    en: 'Abkhazia',
    es: 'Abjasia',
    fr: 'Abkhazie',
    it: 'Abcasia',
    pt: 'Abcásia',
  },
  xn: {
    de: 'Nordzypern',
    en: 'Northern Cyprus',
    es: 'Chipre del Norte',
    fr: 'Chypre du Nord',
    it: 'Cipro del Nord',
    pt: 'Chipre do Norte',
  },
  xo: {
    de: 'Südossetien',
    en: 'South Ossetia',
    es: 'Osetia del Sur',
    fr: 'Ossétie du Sud',
    it: 'Ossezia del Sud',
    pt: 'Ossétia do Sul',
  },
  xs: {
    de: 'Somaliland',
    en: 'Somaliland',
    es: 'Somalilandia',
    fr: 'Somaliland',
    it: 'Somaliland',
    pt: 'Somalilândia',
  },
  xt: {
    de: 'Transnistrien',
    en: 'Transnistria',
    es: 'Transnistria',
    fr: 'Transnistrie',
    it: 'Transnistria',
    pt: 'Transnístria',
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
