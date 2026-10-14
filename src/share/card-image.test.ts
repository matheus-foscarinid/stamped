import { describe, expect, it } from 'vitest'
import { describeVisits } from './card-image.ts'

describe('describeVisits', () => {
  it.each([
    [0, '0 countries visited'],
    [1, '1 country visited'],
    [2, '2 countries visited'],
  ])('uses the singular only for one country (%i)', (count, title) => {
    expect(describeVisits(count).title).toBe(title)
  })

  it('takes the subtitle from the world share', () => {
    expect(describeVisits(1).subtitle).toBe('<1% of the world')
  })
})
