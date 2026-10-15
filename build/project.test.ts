import { geoEquirectangular } from 'd3-geo'
import { describe, expect, it } from 'vitest'
import { projectCountries } from './project.ts'
import { circleAt, countryFeature, squareAt } from './test-fixtures.ts'

const ITALY = countryFeature('IT', [squareAt([0, 30], 30)])
const VATICAN = countryFeature('VA', [squareAt([12.45, 41.9], 0.0005)])
const DOT_WIDTH = 4
// about six grid units across the radius, a malta-sized island next to a 30 degree country
const ISLAND = countryFeature('MT', [circleAt([14.4, 35.9], 0.022)])
// half of the island's 16 corners. the plain tolerance leaves about five
const ROUND_ISLAND_POINTS = 8

const widthOf = (ring: Int16Array | undefined): number => {
  const xs = Array.from(ring ?? []).filter((_, index) => index % 2 === 0)
  return Math.max(...xs) - Math.min(...xs)
}

describe('projectCountries', () => {
  const [italy, vatican] = projectCountries([ITALY, VATICAN], geoEquirectangular).countries

  it('keeps a country big enough for the grid as its own outline', () => {
    expect(italy?.rings).toHaveLength(1)
    expect(widthOf(italy?.rings[0])).toBeGreaterThan(DOT_WIDTH)
  })

  it('gives a country smaller than one grid cell a dot where it sits', () => {
    const [dot] = vatican?.rings ?? []
    expect(dot).toHaveLength(8)
    expect(widthOf(dot)).toBe(DOT_WIDTH)
  })
})

describe('projectCountries on a small island', () => {
  const [, island] = projectCountries([ITALY, ISLAND], geoEquirectangular).countries

  it('keeps enough of its outline to stay round', () => {
    const [ring] = island?.rings ?? []
    expect((ring?.length ?? 0) / 2).toBeGreaterThanOrEqual(ROUND_ISLAND_POINTS)
  })
})
