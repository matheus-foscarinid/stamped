import { describe, expect, it } from 'vitest'
import { getFlagEmoji, isCountryCode, isDisputed, searchCountries } from './index.ts'

const EN = { locale: 'en' }

const firstCode = (query: string) => searchCountries(query, EN)[0]?.code

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
  })

  it('ranks an exact name above a longer name that starts the same way', () => {
    expect(searchCountries('niger', EN).map(match => match.code)).toEqual(['ne', 'ng'])
  })

  it('ranks names that start with the query above ones that only contain it', () => {
    const codes = searchCountries('guinea', EN).map(match => match.code)
    expect(codes[0]).toBe('gn')
    expect(codes.indexOf('pg')).toBeGreaterThan(codes.indexOf('gw'))
  })

  it('returns nothing for a blank query and respects the limit', () => {
    expect(searchCountries('   ', EN)).toEqual([])
    expect(searchCountries('a', { locale: 'en', limit: 3 })).toHaveLength(3)
  })

  it('returns tiny countries the map cannot draw', () => {
    expect(firstCode('vatican')).toBe('va')
    expect(firstCode('monaco')).toBe('mc')
  })
})

describe('searching in another language', () => {
  const PT = { locale: 'pt' }

  it('finds countries by their name in that language', () => {
    expect(searchCountries('alemanha', PT)[0]).toMatchObject({ code: 'de', name: 'Alemanha' })
  })

  it('still finds them by their english name', () => {
    expect(searchCountries('germany', PT)[0]?.code).toBe('de')
  })
})

describe('disputed land', () => {
  it('is searchable by name, including land with no iso code', () => {
    expect(firstCode('kosovo')).toBe('xk')
    expect(firstCode('northern cyprus')).toBe('xn')
    expect(searchCountries('somalilandia', { locale: 'es' })[0]?.name).toBe('Somalilandia')
  })

  it('is tagged as disputed, unlike the country that claims it', () => {
    expect(isDisputed('xs')).toBe(true)
    expect(isDisputed('so')).toBe(false)
  })
})

describe('country helpers', () => {
  it('builds the flag emoji from the code', () => {
    expect(getFlagEmoji('br')).toBe('🇧🇷')
  })

  it('uses a plain flag where emoji sets have none', () => {
    expect(getFlagEmoji('xk')).toBe('🏳️')
  })

  it('accepts only codes in the catalog', () => {
    expect(isCountryCode('br')).toBe(true)
    expect(isCountryCode('zz')).toBe(false)
  })
})
