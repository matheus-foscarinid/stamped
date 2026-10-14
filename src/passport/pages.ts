import type { CountryCode, groupByContinent } from '@/countries'

type ContinentGroup = ReturnType<typeof groupByContinent>[number]

export interface StampPage {
  continent: ContinentGroup['continent']
  codes: CountryCode[]
  visitedCount: number
  total: number
}

// each page holds one continent, so its heading always matches the stamps under it
export const paginateStamps = (groups: readonly ContinentGroup[], perPage: number): StampPage[] =>
  groups.flatMap(({ continent, codes, total }) =>
    Array.from({ length: Math.ceil(codes.length / perPage) }, (_, index) => ({
      continent,
      codes: codes.slice(index * perPage, (index + 1) * perPage),
      visitedCount: codes.length,
      total,
    }))
  )
