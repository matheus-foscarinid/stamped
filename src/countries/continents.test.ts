import { describe, expect, it } from 'vitest'
import { groupByContinent } from './continents.ts'

describe('groupByContinent', () => {
  it('returns nothing before any country is marked', () => {
    expect(groupByContinent([], 'en')).toEqual([])
  })

  it('groups visits in continent order, skipping continents with none', () => {
    const groups = groupByContinent(['jp', 'fr', 'br'], 'en')
    expect(groups.map(group => group.continent)).toEqual(['asia', 'europe', 'southAmerica'])
  })

  it('sorts each continent by the name in the chosen language', () => {
    const [europe] = groupByContinent(['de', 'es', 'at'], 'de')
    expect(europe?.codes).toEqual(['de', 'at', 'es'])
  })

  it('counts every country the continent has, visited or not', () => {
    const [southAmerica] = groupByContinent(['br'], 'en')
    expect(southAmerica?.total).toBe(16)
  })
})
