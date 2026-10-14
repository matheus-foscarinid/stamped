import { describe, expect, it } from 'vitest'
import { COUNTRY_CODES } from './catalog.ts'
import { formatWorldShare, getTravelStats } from './stats.ts'

const VISITED_ON_THREE_CONTINENTS = ['jp', 'br', 'pt', 'fr', 'ar'] as const

describe('before any country is marked', () => {
  it('reaches no continents and counts none', () => {
    const stats = getTravelStats([], 'en')
    expect(stats.continents).toEqual([])
    expect(stats.unMemberCount).toBe(0)
  })
})

describe('after marking countries', () => {
  it('lists each continent once, in a fixed order', () => {
    const stats = getTravelStats(VISITED_ON_THREE_CONTINENTS, 'en')
    expect(stats.continents).toEqual(['asia', 'europe', 'southAmerica'])
  })

  it('leaves territories out of the un member count', () => {
    const stats = getTravelStats(['fr', 'gf', 'va'], 'en')
    expect(stats.unMemberCount).toBe(1)
  })
})

describe('formatWorldShare', () => {
  it.each([
    [0, '0%'],
    [1, '<1%'],
    [2, '1%'],
    [COUNTRY_CODES.length, '100%'],
  ])('shows %i countries as %s', (count, share) => {
    expect(formatWorldShare(count, 'en')).toBe(share)
  })

  it('writes the percent the way the language does', () => {
    expect(formatWorldShare(COUNTRY_CODES.length, 'fr')).toBe('100\u00a0%')
  })
})
