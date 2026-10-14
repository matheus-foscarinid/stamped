import { COUNTRY_CODES, type CountryCode } from './catalog.ts'
import { CONTINENTS, type Continent, getContinent, isUnMember } from './regions.ts'

const UN_MEMBER_TOTAL = COUNTRY_CODES.filter(isUnMember).length

export interface TravelStats {
  continentTotal: number
  continents: Continent[]
  unMemberCount: number
  unMemberTotal: number
  worldShare: string
}

export const formatWorldShare = (visitedCount: number, locale: string): string => {
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
  const share = visitedCount / COUNTRY_CODES.length
  if (visitedCount > 0 && share < 0.005) return `<${percent.format(0.01)}`
  return percent.format(share)
}

export const getTravelStats = (visited: readonly CountryCode[], locale: string): TravelStats => {
  const reached = new Set(visited.map(getContinent))
  const continents = CONTINENTS.filter(continent => reached.has(continent))
  return {
    continents,
    continentTotal: CONTINENTS.length,
    unMemberCount: visited.filter(isUnMember).length,
    unMemberTotal: UN_MEMBER_TOTAL,
    worldShare: formatWorldShare(visited.length, locale),
  }
}
