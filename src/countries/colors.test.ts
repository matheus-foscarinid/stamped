import { describe, expect, it } from 'vitest'
import { countBy } from '@/test/counts'
import { COUNTRY_CODES } from './catalog.ts'
import { getCountryHue } from './colors.ts'

const HUES = COUNTRY_CODES.map(getCountryHue)

describe('getCountryHue', () => {
  it('keeps neighbours that share a letter apart', () => {
    const [france, germany] = [getCountryHue('fr'), getCountryHue('de')]
    const distance = Math.min(Math.abs(france - germany), 360 - Math.abs(france - germany))
    expect(distance).toBeGreaterThan(60)
  })

  it('spreads countries around the whole wheel, so neighbours rarely match', () => {
    expect(Math.max(...countBy(HUES, hue => hue))).toBeLessThanOrEqual(4)
    const sliceCounts = countBy(HUES, hue => Math.floor(hue / 30))
    expect(sliceCounts).toHaveLength(12)
    for (const count of sliceCounts) expect(count).toBeGreaterThanOrEqual(10)
  })
})
