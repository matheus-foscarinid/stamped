import type { Feature, Geometry } from 'geojson'
import { describe, expect, it } from 'vitest'
import { splitOverseasParts } from './overseas.ts'
import type { CountryProperties } from './source.ts'
import { countryFeature, squareAt } from './test-fixtures.ts'

const METROPOLITAN_FRANCE = squareAt([2, 46])
const CORSICA = squareAt([9, 42])
const FRENCH_GUIANA = squareAt([-53, 4])
const GUADELOUPE = squareAt([-62, 16])
const MARTINIQUE = squareAt([-61.5, 14])
const REUNION = squareAt([55, -21.5])
const MAYOTTE = squareAt([45, -13])
const MAINLAND_NETHERLANDS = squareAt([5, 52])
const BONAIRE = squareAt([-68.5, 12])
const MAINLAND_NORWAY = squareAt([10, 62])
const SVALBARD = squareAt([16, 78])

const describeFeatures = (features: Feature<Geometry, CountryProperties>[]) =>
  features.map(({ properties, geometry }) => ({
    code: properties.ISO_A2_EH,
    parts: geometry.type === 'MultiPolygon' ? geometry.coordinates.length : 0,
  }))

describe('splitOverseasParts', () => {
  it('gives french guiana its own shape and keeps corsica with france', () => {
    const split = splitOverseasParts([
      countryFeature('FR', [METROPOLITAN_FRANCE, CORSICA, FRENCH_GUIANA]),
    ])
    expect(describeFeatures(split)).toEqual([
      { code: 'FR', parts: 2 },
      { code: 'GF', parts: 1 },
    ])
  })

  it('gives each overseas island its own shape, with martinique kept apart from french guiana', () => {
    const islands = [GUADELOUPE, MARTINIQUE, FRENCH_GUIANA, REUNION, MAYOTTE]
    const split = splitOverseasParts([countryFeature('FR', [METROPOLITAN_FRANCE, ...islands])])
    expect(describeFeatures(split)).toEqual([
      { code: 'FR', parts: 1 },
      { code: 'GP', parts: 1 },
      { code: 'MQ', parts: 1 },
      { code: 'GF', parts: 1 },
      { code: 'RE', parts: 1 },
      { code: 'YT', parts: 1 },
    ])
  })

  it.each([
    ['NL', 'BQ', MAINLAND_NETHERLANDS, BONAIRE],
    ['NO', 'SJ', MAINLAND_NORWAY, SVALBARD],
  ])('gives %s its territory %s as its own shape', (country, territory, mainland, island) => {
    const split = splitOverseasParts([countryFeature(country, [mainland, island])])
    expect(describeFeatures(split)).toEqual([
      { code: country, parts: 1 },
      { code: territory, parts: 1 },
    ])
  })

  it('leaves other countries and territory-free shapes untouched', () => {
    const brazil = countryFeature('BR', [squareAt([-50, -10])])
    const franceAlone = countryFeature('FR', [METROPOLITAN_FRANCE])
    expect(splitOverseasParts([brazil, franceAlone])).toEqual([brazil, franceAlone])
  })
})
