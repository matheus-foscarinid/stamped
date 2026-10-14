import { describe, expect, it } from 'vitest'
import { COUNTRY_CODES } from '@/countries'
import { isInside, overlaps } from '@/test/rects'
import { layoutPassportImage } from './passport-image-layout.ts'

const FEW_STAMPS = 3
const ALL_COUNTRIES = COUNTRY_CODES.length

describe('the stamp page', () => {
  it.each([0, 1, 7, 13, ALL_COUNTRIES])('fits %s stamps on the page without overlaps', count => {
    const { stampCells, stampArea } = layoutPassportImage(count)
    expect(stampCells).toHaveLength(count)
    for (const cell of stampCells) expect(isInside(cell, stampArea)).toBe(true)
    const overlapping = stampCells.filter((cell, index) =>
      stampCells.slice(index + 1).some(other => overlaps(cell, other))
    )
    expect(overlapping).toEqual([])
  })

  it('keeps stamps a readable size when there are only a few', () => {
    const [few] = layoutPassportImage(FEW_STAMPS).stampCells
    const [many] = layoutPassportImage(ALL_COUNTRIES).stampCells
    expect(few?.width).toBeGreaterThan(many?.width ?? 0)
  })

  it('centres a short grid across the page', () => {
    const { stampCells, stampArea } = layoutPassportImage(FEW_STAMPS)
    const first = stampCells[0]
    const last = stampCells.at(-1)
    const leftGap = (first?.x ?? 0) - stampArea.x
    const rightGap = stampArea.x + stampArea.width - ((last?.x ?? 0) + (last?.width ?? 0))
    expect(leftGap).toBeCloseTo(rightGap)
  })
})

describe('the data page', () => {
  it('stacks the header, map, headline and stats above the machine lines on the right page', () => {
    const { pages, header, map, headline, stats, machine } = layoutPassportImage(13)
    const [, right] = pages
    for (const block of [header, map, headline, stats, machine])
      expect(isInside(block, right)).toBe(true)
    expect(header.y + header.height).toBeLessThan(map.y)
    expect(map.y + map.height).toBeLessThan(headline.y)
    expect(headline.y + headline.height).toBeLessThan(stats.y)
    expect(stats.y + stats.height).toBeLessThan(machine.y)
  })
})
