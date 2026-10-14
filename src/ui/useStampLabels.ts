import { type CountryCode, getContinent, getCountryName } from '@/countries'
import { useI18n } from '@/i18n/useI18n'

export interface StampLabels {
  name: string
  continent: string
}

export const useStampLabels = () => {
  const { language, t } = useI18n()
  return (code: CountryCode): StampLabels => {
    const continentId = getContinent(code)
    return {
      name: getCountryName(code, language.value),
      continent: continentId ? t(`continent.${continentId}`) : '',
    }
  }
}
