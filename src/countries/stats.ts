import { COUNTRY_CODES, type CountryCode } from './catalog.ts'
import { CONTINENTS, getContinent, isUnMember } from './regions.ts'

const UN_MEMBER_TOTAL = COUNTRY_CODES.filter(isUnMember).length
const continentList = new Intl.ListFormat('en', { type: 'conjunction' })

export interface TravelStats {
  continentCount: number
  continentTotal: number
  continentNames: string
  unMemberCount: number
  unMemberTotal: number
  worldShare: string
}

export const formatWorldShare = (visitedCount: number): string => {
  const percent = Math.round((visitedCount / COUNTRY_CODES.length) * 100)
  if (percent === 0 && visitedCount > 0) return '<1%'
  return `${percent}%`
}

export const getTravelStats = (visited: readonly CountryCode[]): TravelStats => {
  const reached = new Set(visited.map(getContinent))
  const continents = CONTINENTS.filter(continent => reached.has(continent))
  return {
    continentCount: continents.length,
    continentTotal: CONTINENTS.length,
    continentNames: continentList.format(continents),
    unMemberCount: visited.filter(isUnMember).length,
    unMemberTotal: UN_MEMBER_TOTAL,
    worldShare: formatWorldShare(visited.length),
  }
}
