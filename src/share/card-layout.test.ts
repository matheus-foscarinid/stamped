import { describe, expect, it } from 'vitest'
import { describeVisits, EXPORT_FORMAT_IDS, EXPORT_FORMATS, layoutCard } from './card-layout.ts'

const STORY_BAR_HEIGHT = 250

describe('layoutCard', () => {
  it.each(EXPORT_FORMAT_IDS)(
    'fits the %s map inside the padded frame, below the headline',
    format => {
      const { width, height } = EXPORT_FORMATS[format]
      const { padding, map, subtitle } = layoutCard(format)
      expect(padding).toBeGreaterThan(0)
      expect(map.y).toBeGreaterThan(subtitle.baseline)
      expect(map.x).toBe(padding)
      expect(map.x + map.width).toBe(width - padding)
      expect(map.y + map.height).toBeLessThanOrEqual(height - padding)
      expect(map.height).toBeGreaterThan(height / 2)
    }
  )

  it('keeps the story clear of the bars the app draws over it', () => {
    const { height } = EXPORT_FORMATS.story
    const { title, map } = layoutCard('story')
    expect(title.baseline - title.size).toBeGreaterThanOrEqual(STORY_BAR_HEIGHT)
    expect(map.y + map.height).toBeLessThanOrEqual(height - STORY_BAR_HEIGHT)
  })
})

describe('describeVisits', () => {
  it('counts countries and the rounded share of the world', () => {
    expect(describeVisits(25)).toEqual({
      title: '25 countries visited',
      subtitle: '10% of the world',
    })
  })

  it.each([
    [0, '0 countries visited'],
    [1, '1 country visited'],
    [2, '2 countries visited'],
  ])('uses the singular only for one country (%i)', (count, title) => {
    expect(describeVisits(count).title).toBe(title)
  })
})
