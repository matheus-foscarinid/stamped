import type { Feature, Geometry } from 'geojson'
import { describe, expect, it } from 'vitest'
import { splitOverseasParts } from './overseas.ts'
import type { CountryProperties } from './source.ts'
import { countryFeature, squareAt } from './test-fixtures.ts'

const METROPOLITAN_FRANCE = squareAt([2, 46])
const CORSICA = squareAt([9, 42])
const FRENCH_GUIANA = squareAt([-53, 4])
const FRENCH_CARIBBEAN = squareAt([-62, 16])
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

  it('keeps far west land north of french guiana with france', () => {
    const split = splitOverseasParts([
      countryFeature('FR', [METROPOLITAN_FRANCE, FRENCH_CARIBBEAN, FRENCH_GUIANA]),
    ])
    expect(describeFeatures(split)).toEqual([
      { code: 'FR', parts: 2 },
      { code: 'GF', parts: 1 },
    ])
  })

  it('gives svalbard its own shape apart from norway', () => {
    const split = splitOverseasParts([countryFeature('NO', [MAINLAND_NORWAY, SVALBARD])])
    expect(describeFeatures(split)).toEqual([
      { code: 'NO', parts: 1 },
      { code: 'SJ', parts: 1 },
    ])
  })

  it('leaves other countries and territory-free shapes untouched', () => {
    const brazil = countryFeature('BR', [squareAt([-50, -10])])
    const franceAlone = countryFeature('FR', [METROPOLITAN_FRANCE])
    expect(splitOverseasParts([brazil, franceAlone])).toEqual([brazil, franceAlone])
  })
})
