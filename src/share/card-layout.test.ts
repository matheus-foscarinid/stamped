import { describe, expect, it } from 'vitest'
import type { ScreenRect } from '@/map'
import { EXPORT_FORMAT_IDS, EXPORT_FORMATS, layoutCard } from './card-layout.ts'

const STORY_BAR_HEIGHT = 250
const STACK_ORDER = [
  'header',
  'eyebrow',
  'count',
  'countLabel',
  'progress',
  'tiles',
  'footer',
] as const

const bottomOf = (rect: ScreenRect) => rect.y + rect.height

describe('layoutCard', () => {
  it.each(EXPORT_FORMAT_IDS)(
    'keeps every %s block inside the card, in order, without overlaps',
    format => {
      const { width, height } = EXPORT_FORMATS[format]
      const { blocks } = layoutCard(format)
      STACK_ORDER.forEach((block, index) => {
        const rect = blocks[block]
        expect(rect.x).toBeGreaterThanOrEqual(0)
        expect(rect.x + rect.width).toBeLessThanOrEqual(width)
        expect(rect.y).toBeGreaterThanOrEqual(0)
        expect(bottomOf(rect)).toBeLessThanOrEqual(height)
        const previous = STACK_ORDER[index - 1]
        if (previous) expect(rect.y).toBeGreaterThanOrEqual(bottomOf(blocks[previous]))
      })
    }
  )

  it.each(['post', 'story'] as const)(
    'puts the %s map between the count and the progress bar',
    format => {
      const { width } = EXPORT_FORMATS[format]
      const { blocks, map } = layoutCard(format)
      expect(map.y).toBeGreaterThan(bottomOf(blocks.countLabel))
      expect(bottomOf(map)).toBeLessThan(blocks.progress.y)
      expect(map.width).toBeGreaterThan(width * 0.9)
      expect(map.height).toBeGreaterThan(map.width / 3)
    }
  )

  it('keeps the story clear of the bars the app draws over it', () => {
    const { height } = EXPORT_FORMATS.story
    const { blocks } = layoutCard('story')
    expect(blocks.header.y).toBeGreaterThanOrEqual(STORY_BAR_HEIGHT)
    expect(bottomOf(blocks.footer)).toBeLessThanOrEqual(height - STORY_BAR_HEIGHT)
  })

  it('gives the wide card a text column and the map beside it', () => {
    const { width, height } = EXPORT_FORMATS.wide
    const { blocks, map } = layoutCard('wide')
    expect(map.x).toBeGreaterThan(blocks.tiles.x + blocks.tiles.width)
    expect(map.x + map.width).toBe(width)
    expect(map.height).toBe(height)
  })

  it.each(EXPORT_FORMAT_IDS)('splits the %s stats row into two tiles side by side', format => {
    const { blocks, tiles } = layoutCard(format)
    const [left, right] = tiles
    expect(left.x).toBe(blocks.tiles.x)
    expect(right.x).toBeGreaterThan(left.x + left.width)
    expect(right.x + right.width).toBeCloseTo(blocks.tiles.x + blocks.tiles.width)
  })
})
