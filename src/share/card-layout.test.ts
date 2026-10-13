import { describe, expect, it } from 'vitest'
import { describeVisits, EXPORT_FORMAT_IDS, EXPORT_FORMATS, layoutCard } from './card-layout.ts'

describe('layoutCard', () => {
  it.each(EXPORT_FORMAT_IDS)('keeps the %s map inside the image, below the headline', format => {
    const { width, height } = EXPORT_FORMATS[format]
    const { map, subtitle } = layoutCard(format)
    expect(map.y).toBeGreaterThan(subtitle.baseline)
    expect(map.x + map.width).toBeLessThanOrEqual(width)
    expect(map.y + map.height).toBeLessThanOrEqual(height)
    expect(map.height).toBeGreaterThan(height / 3)
  })

  it('keeps the story clear of the bars the app draws over it', () => {
    const { title, map } = layoutCard('story')
    expect(title.baseline - title.size).toBeGreaterThanOrEqual(250)
    expect(map.y + map.height).toBeLessThanOrEqual(1920 - 250)
  })
})

describe('describeVisits', () => {
  it('counts countries and the share of the world', () => {
    expect(describeVisits(25)).toEqual({
      title: '25 countries visited',
      subtitle: '10% of the world',
    })
  })

  it('uses the singular for one country', () => {
    expect(describeVisits(1).title).toBe('1 country visited')
  })

  it('reads well before anything is marked', () => {
    expect(describeVisits(0)).toEqual({ title: '0 countries visited', subtitle: '0% of the world' })
  })
})
