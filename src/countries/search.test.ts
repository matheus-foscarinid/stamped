import { describe, expect, it } from 'vitest'
import { getFlagEmoji, isCountryCode, searchCountries } from './index.ts'

const firstCode = (query: string) => searchCountries(query)[0]?.code

describe('searchCountries', () => {
  it('ignores accents and punctuation in both the query and the names', () => {
    expect(firstCode('cote d ivoire')).toBe('ci')
    expect(firstCode("Côte d'Ivoire")).toBe('ci')
    expect(firstCode('aland')).toBe('ax')
  })

  it('finds countries by the names people use, not only the official ones', () => {
    expect(firstCode('uk')).toBe('gb')
    expect(firstCode('ivory coast')).toBe('ci')
    expect(firstCode('turkey')).toBe('tr')
    expect(firstCode('holland')).toBe('nl')
  })

  it('ranks an exact name above a longer name that starts the same way', () => {
    expect(searchCountries('niger').map(match => match.code)).toEqual(['ne', 'ng'])
  })

  it('ranks names that start with the query above ones that only contain it', () => {
    const codes = searchCountries('guinea').map(match => match.code)
    expect(codes[0]).toBe('gn')
    expect(codes.indexOf('pg')).toBeGreaterThan(codes.indexOf('gw'))
  })

  it('returns nothing for a blank query and respects the limit', () => {
    expect(searchCountries('   ')).toEqual([])
    expect(searchCountries('a', 3)).toHaveLength(3)
  })

  it('returns tiny countries the map cannot draw', () => {
    expect(firstCode('vatican')).toBe('va')
    expect(firstCode('monaco')).toBe('mc')
  })
})

describe('country helpers', () => {
  it('builds the flag emoji from the code', () => {
    expect(getFlagEmoji('br')).toBe('🇧🇷')
  })

  it('accepts only codes in the catalog', () => {
    expect(isCountryCode('br')).toBe(true)
    expect(isCountryCode('xk')).toBe(false)
  })
})
