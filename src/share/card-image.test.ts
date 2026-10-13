import { describe, expect, it } from 'vitest'
import { describeVisits } from './card-image.ts'

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

  it.each([
    [0, '0% of the world'],
    [1, '<1% of the world'],
    [2, '1% of the world'],
  ])('never rounds a visited map down to zero (%i)', (count, subtitle) => {
    expect(describeVisits(count).subtitle).toBe(subtitle)
  })
})
