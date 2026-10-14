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
    expect(fitLabelSize('Peru', 84)).toBe(fitLabelSize('Chad', 84))
  })

  it('shrinks long names in proportion, so they still fit the space', () => {
    const long = fitLabelSize('A'.repeat(40), 84)
    expect(long).toBeLessThan(fitLabelSize('Peru', 84))
    expect(fitLabelSize('A'.repeat(80), 84)).toBeCloseTo(long / 2)
  })

  it('copes with an empty label', () => {
    expect(fitLabelSize('', 84)).toBe(fitLabelSize('Peru', 84))
  })
})
