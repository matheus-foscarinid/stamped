import { describe, expect, it } from 'vitest'
import { COUNTRY_CODES } from '@/countries'
import { getStampStyle, STAMP_SHAPES } from './stamp-style.ts'

const ALL_STYLES = COUNTRY_CODES.map(getStampStyle)

describe('getStampStyle', () => {
  it('gives a country the same stamp every time', () => {
    expect(getStampStyle('br')).toEqual(getStampStyle('br'))
  })

  it('keeps the tilt small enough to read the stamp', () => {
    for (const { tiltDeg } of ALL_STYLES) expect(Math.abs(tiltDeg)).toBeLessThanOrEqual(8)
  })

  it('uses every shape and ink across the countries', () => {
    expect(new Set(ALL_STYLES.map(style => style.shape))).toEqual(new Set(STAMP_SHAPES))
    expect(new Set(ALL_STYLES.map(style => style.ink)).size).toBe(5)
  })
})
