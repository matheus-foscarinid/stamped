import { describe, expect, it } from 'vitest'
import { COUNTRY_CODES } from '@/countries'
import { fitLabelSize, getStampStyle, STAMP_SHAPES } from './stamp-style.ts'

const ALL_STYLES = COUNTRY_CODES.map(getStampStyle)

describe('getStampStyle', () => {
  it('gives a country the same stamp every time', () => {
    expect(getStampStyle('br')).toEqual(getStampStyle('br'))
  })

  it('keeps the tilt small enough to read the stamp', () => {
    for (const { tiltDeg } of ALL_STYLES) expect(Math.abs(tiltDeg)).toBeLessThanOrEqual(8)
  })

  it('uses every shape across the countries', () => {
    expect(new Set(ALL_STYLES.map(style => style.shape))).toEqual(new Set(STAMP_SHAPES))
  })
})

describe('fitLabelSize', () => {
  it('keeps short names at the full size', () => {
    expect(fitLabelSize('Peru', 84)).toBe(9)
  })

  it('shrinks long names so they still fit the space', () => {
    const size = fitLabelSize('Bosnia and Herzegovina', 84)
    expect(size).toBeLessThan(9)
    expect(size * 'Bosnia and Herzegovina'.length * 0.68).toBeCloseTo(84)
  })
})
