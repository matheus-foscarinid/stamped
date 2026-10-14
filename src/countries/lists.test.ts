import { describe, expect, it } from 'vitest'
import { canToggleMark, getCountryMark, keepVisitWins, toggleMark } from './lists.ts'

const LISTS = { visited: ['br', 'jp'], wishlist: ['is'] } as const

describe('getCountryMark', () => {
  it('tells visited, wished and unmarked countries apart', () => {
    expect(getCountryMark(LISTS, 'br')).toBe('visited')
    expect(getCountryMark(LISTS, 'is')).toBe('wishlist')
    expect(getCountryMark(LISTS, 'nz')).toBeNull()
  })
})

describe('toggling a visit', () => {
  it('adds an unmarked country and removes a visited one', () => {
    expect(toggleMark(LISTS, 'nz', 'visited').visited).toEqual(['br', 'jp', 'nz'])
    expect(toggleMark(LISTS, 'br', 'visited').visited).toEqual(['jp'])
  })

  it('moves a wished country off the wishlist once visited', () => {
    expect(toggleMark(LISTS, 'is', 'visited')).toEqual({
      visited: ['br', 'jp', 'is'],
      wishlist: [],
    })
  })
})

describe('toggling a wish', () => {
  it('adds an unmarked country and removes a wished one', () => {
    expect(toggleMark(LISTS, 'nz', 'wishlist').wishlist).toEqual(['is', 'nz'])
    expect(toggleMark(LISTS, 'is', 'wishlist').wishlist).toEqual([])
  })

  it('leaves a visited country as it is, and says so up front', () => {
    expect(canToggleMark(LISTS, 'br', 'wishlist')).toBe(false)
    expect(toggleMark(LISTS, 'br', 'wishlist')).toBe(LISTS)
    expect(canToggleMark(LISTS, 'br', 'visited')).toBe(true)
  })
})

describe('keepVisitWins', () => {
  it('drops wishes for countries already visited', () => {
    expect(keepVisitWins({ visited: ['br'], wishlist: ['br', 'is'] })).toEqual({
      visited: ['br'],
      wishlist: ['is'],
    })
  })
})
