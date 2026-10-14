import { describe, expect, it } from 'vitest'
import { getTravelStats } from './stats.ts'

describe('before any country is marked', () => {
  it('starts every count at zero', () => {
    expect(getTravelStats([])).toEqual({
      continentCount: 0,
      continentTotal: 7,
      continentNames: '',
      unMemberCount: 0,
      unMemberTotal: 193,
      worldShare: '0%',
    })
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

  it('never rounds a visited map down to 0%', () => {
    expect(getTravelStats(['br']).worldShare).toBe('<1%')
  })
})
