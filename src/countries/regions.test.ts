import { describe, expect, it } from 'vitest'
import { COUNTRY_CODES } from './catalog.ts'
import { CONTINENTS, getContinent, isUnMember } from './regions.ts'

const UN_MEMBER_COUNT = 193

describe('getContinent', () => {
  it('places every country in the catalog on a continent', () => {
    const unplaced = COUNTRY_CODES.filter(code => getContinent(code) === undefined)
    expect(unplaced).toEqual([])
  })

  it('splits the americas at panama and keeps overseas parts where they sit', () => {
    expect(getContinent('pa')).toBe('North America')
    expect(getContinent('co')).toBe('South America')
    expect(getContinent('gf')).toBe('South America')
    expect(getContinent('fr')).toBe('Europe')
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

  it('leaves out observers and territories', () => {
    expect(isUnMember('va')).toBe(false)
    expect(isUnMember('ps')).toBe(false)
    expect(isUnMember('gl')).toBe(false)
    expect(isUnMember('br')).toBe(true)
  })
})
