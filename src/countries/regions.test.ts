import { describe, expect, it } from 'vitest'
import { COUNTRY_CODES } from './catalog.ts'
import { CONTINENTS, getContinent, isUnMember } from './regions.ts'

const UN_MEMBER_COUNT = 193

describe('getContinent', () => {
  it('places every country in the catalog on a continent', () => {
    const unplaced = COUNTRY_CODES.filter(code => getContinent(code) === undefined)
    expect(unplaced).toEqual([])
  })

  it('uses every continent', () => {
    const used = new Set(COUNTRY_CODES.map(getContinent))
    expect([...used].sort()).toEqual([...CONTINENTS])
  })
})

describe('isUnMember', () => {
  it('counts the 193 un member states', () => {
    expect(COUNTRY_CODES.filter(isUnMember)).toHaveLength(UN_MEMBER_COUNT)
  })
})
