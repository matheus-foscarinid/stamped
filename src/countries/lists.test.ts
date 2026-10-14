import { describe, expect, it } from 'vitest'
import { getCountryMark, toggleVisited, toggleWishlisted } from './lists.ts'

const LISTS = { visited: ['br', 'jp'], wishlist: ['is'] } as const

describe('getCountryMark', () => {
  it('tells visited, wished and unmarked countries apart', () => {
    expect(getCountryMark(LISTS, 'br')).toBe('visited')
    expect(getCountryMark(LISTS, 'is')).toBe('wishlist')
    expect(getCountryMark(LISTS, 'nz')).toBeNull()
  })
})

describe('toggleVisited', () => {
  it('adds an unmarked country and removes a visited one', () => {
    expect(toggleVisited(LISTS, 'nz').visited).toEqual(['br', 'jp', 'nz'])
    expect(toggleVisited(LISTS, 'br').visited).toEqual(['jp'])
  })

  it('moves a wished country off the wishlist once visited', () => {
    expect(toggleVisited(LISTS, 'is')).toEqual({ visited: ['br', 'jp', 'is'], wishlist: [] })
  })
})

describe('toggleWishlisted', () => {
  it('adds an unmarked country and removes a wished one', () => {
    expect(toggleWishlisted(LISTS, 'nz').wishlist).toEqual(['is', 'nz'])
    expect(toggleWishlisted(LISTS, 'is').wishlist).toEqual([])
  })

  it('leaves a visited country as it is', () => {
    expect(toggleWishlisted(LISTS, 'br')).toBe(LISTS)
  })
})
