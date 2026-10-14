import { describe, expect, it } from 'vitest'
import { COUNTRY_CODES } from './catalog.ts'
import { formatWorldShare, getTravelStats } from './stats.ts'

describe('before any country is marked', () => {
  it('names no continents and counts none', () => {
    const stats = getTravelStats([])
    expect(stats.continentCount).toBe(0)
    expect(stats.continentNames).toBe('')
    expect(stats.unMemberCount).toBe(0)
  })
})

describe('after marking countries', () => {
  it('counts each continent once and names them in a fixed order', () => {
    const stats = getTravelStats(['jp', 'br', 'pt', 'fr', 'ar'])
    expect(stats.continentCount).toBe(3)
    expect(stats.continentNames).toBe('Asia, Europe, and South America')
  })

  it('leaves territories out of the un member count', () => {
    const stats = getTravelStats(['fr', 'gf', 'va'])
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
    expect(formatWorldShare(count)).toBe(share)
  })
})
