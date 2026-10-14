import { COUNTRY_CODES, type CountryCode } from './catalog.ts'
import { getCountryName } from './names.ts'
import { CONTINENTS, type Continent, getContinent } from './regions.ts'

interface ContinentGroup {
  continent: Continent
  codes: CountryCode[]
  total: number
}

const CONTINENT_TOTALS = new Map(
  CONTINENTS.map(continent => [
    continent,
    COUNTRY_CODES.filter(code => getContinent(code) === continent).length,
  ])
)

// only continents with a visit, each sorted by the name readers see
export const groupByContinent = (
  visited: readonly CountryCode[],
  locale: string
): ContinentGroup[] =>
  CONTINENTS.map(continent => ({
    continent,
    codes: visited
      .filter(code => getContinent(code) === continent)
      .sort((a, b) => getCountryName(a, locale).localeCompare(getCountryName(b, locale), locale)),
    total: CONTINENT_TOTALS.get(continent) ?? 0,
  })).filter(group => group.codes.length > 0)
