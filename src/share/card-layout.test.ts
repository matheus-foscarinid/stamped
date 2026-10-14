import { describe, expect, it } from 'vitest'
import { EXPORT_FORMAT_IDS, EXPORT_FORMATS, layoutCard } from './card-layout.ts'

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

  it.each(EXPORT_FORMAT_IDS)('keeps the %s wordmark below the map and inside the frame', format => {
    const { height, safeInset } = EXPORT_FORMATS[format]
    const { padding, map, wordmark } = layoutCard(format)
    expect(wordmark.baseline - wordmark.size).toBeGreaterThan(map.y + map.height)
    expect(wordmark.baseline).toBeLessThanOrEqual(height - (safeInset ?? padding))
  })
})
