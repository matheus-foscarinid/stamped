import { describe, expect, it } from 'vitest'
import { changeMarks, toMarkStates } from './marks.ts'

const NOTHING_FADING = new Map()

describe('toMarkStates', () => {
  it('draws a code on both lists as visited', () => {
    expect(toMarkStates({ visited: ['br'], wishlist: ['br', 'is'] })).toEqual(
      new Map([
        ['br', 'visited'],
        ['is', 'wishlist'],
      ])
    )
  })
})

describe('changeMarks', () => {
  const previous = toMarkStates({ visited: ['br'], wishlist: ['is'] })

  it('fades only the codes whose state changed, from what they were', () => {
    const change = changeMarks({
      previous,
      next: { visited: ['br', 'is'], wishlist: ['nz'] },
      fading: NOTHING_FADING,
    })
    expect(change.changed.sort()).toEqual(['is', 'nz'])
    expect(change.fadingFrom).toEqual(
      new Map([
        ['is', 'wishlist'],
        ['nz', 'unmarked'],
      ])
    )
  })

  it('fades a removed visit back to plain land', () => {
    const change = changeMarks({
      previous,
      next: { visited: [], wishlist: ['is'] },
      fading: NOTHING_FADING,
    })
    expect(change.changed).toEqual(['br'])
    expect(change.fadingFrom.get('br')).toBe('visited')
  })

  it('keeps codes still mid fade, so an earlier fade finishes from where it started', () => {
    const change = changeMarks({
      previous,
      next: { visited: ['br'], wishlist: [] },
      fading: new Map([['jp', 'unmarked']]),
    })
    expect(change.fadingFrom).toEqual(
      new Map([
        ['jp', 'unmarked'],
        ['is', 'wishlist'],
      ])
    )
  })
})
