import { describe, expect, it } from 'vitest'
import { findNearestSmall, pickWithinReach } from './bounds.ts'

const ITALY = { minX: 0, minY: 0, maxX: 100, maxY: 100 }
const VATICAN = { minX: 40, minY: 40, maxX: 41, maxY: 41 }
const SAN_MARINO = { minX: 50, minY: 30, maxX: 51, maxY: 31 }
const COUNTRIES = [ITALY, VATICAN, SAN_MARINO]
const REACH = 8
const ANY_COUNTRY = (_index: number) => true

const boxOf = (width: number, minX = 0) => ({ minX, minY: 0, maxX: minX + width, maxY: 1 })

const findNear = (bounds: typeof COUNTRIES, x: number, y: number) =>
  findNearestSmall(bounds, { point: { x, y }, reach: REACH, isCandidate: ANY_COUNTRY })

describe('findNearestSmall', () => {
  it('picks the nearest tiny country within reach, leaving italy to its outline', () => {
    expect(findNear(COUNTRIES, 43, 41)).toBe(1)
    expect(findNear(COUNTRIES, 49, 32)).toBe(2)
  })

  it('measures from the middle of each box, not a corner', () => {
    expect(findNear([boxOf(6), boxOf(6, 10)], 7.5, 0.5)).toBe(0)
  })

  it.each([
    [7.5, 0],
    [8.5, null],
  ])('counts a country %s wide as tiny only while it fits the reach', (width, expected) => {
    expect(findNear([boxOf(width)], width / 2, 0.5)).toBe(expected)
  })

  it.each([
    [7.5, 0],
    [8.5, null],
  ])('finds a tiny country %s away only while it is within reach', (distance, expected) => {
    expect(findNear([boxOf(1)], 0.5 + distance, 0.5)).toBe(expected)
  })

  it('skips tiny shapes that cannot be selected', () => {
    const search = {
      point: { x: 43, y: 41 },
      reach: REACH,
      isCandidate: (index: number) => index !== 1,
    }
    expect(findNearestSmall(COUNTRIES, search)).toBeNull()
  })
})

describe('pickWithinReach', () => {
  const pickAt = (hit: number | null, isCandidate = ANY_COUNTRY) =>
    pickWithinReach(COUNTRIES, { hit, point: { x: 43, y: 41 }, reach: REACH, isCandidate })

  it('keeps the country under the point even with a tiny one in reach', () => {
    expect(pickAt(0)).toBe(0)
  })

  it('falls back to the tiny country when the point misses every shape', () => {
    expect(pickAt(null)).toBe(1)
  })

  it('falls back to the tiny country when the shape under the point has no code', () => {
    expect(pickAt(0, index => index !== 0)).toBe(1)
  })
})
