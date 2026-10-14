import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stubAddressBar, stubStorage } from '@/test/browser-stubs'
import { mountComposable } from '@/test/composables'
import { useTravelMap } from './useTravelMap.ts'

const STARTING_LINK = '#v=br&w=is'

const mountTravelMap = () => mountComposable(useTravelMap).result

beforeEach(() => {
  stubAddressBar({ hash: STARTING_LINK })
  stubStorage()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('in visited mode', () => {
  it('marks a tapped country as visited', () => {
    const map = mountTravelMap()
    map.toggleCountry('nz')
    expect(map.visited.value).toEqual(['br', 'nz'])
    expect(map.wishlist.value).toEqual(['is'])
  })
})

describe('after switching to wishlist mode', () => {
  it('adds a tapped country to the wishlist', () => {
    const map = mountTravelMap()
    map.toggleMarkMode()
    map.toggleCountry('nz')
    expect(map.wishlist.value).toEqual(['is', 'nz'])
    expect(map.visited.value).toEqual(['br'])
  })

  it('leaves visited countries alone and reports them as not toggleable', () => {
    const map = mountTravelMap()
    map.toggleMarkMode()
    expect(map.canToggle('br')).toBe(false)
    map.toggleCountry('br')
    expect(map.visited.value).toEqual(['br'])
  })

  it('goes back to marking visits once switched off', () => {
    const map = mountTravelMap()
    map.toggleMarkMode()
    map.toggleMarkMode()
    map.toggleCountry('is')
    expect(map.visited.value).toEqual(['br', 'is'])
    expect(map.wishlist.value).toEqual([])
  })
})

describe('after clearing the map', () => {
  it('empties both lists', () => {
    const map = mountTravelMap()
    map.clearMap()
    expect(map.markedCount.value).toBe(0)
  })
})
