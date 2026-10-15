import { describe, expect, it } from 'vitest'
import { simplifyLine } from './simplify.ts'

const TOLERANCE = 1

const lineWithBump = (height: number) => [0, 0, 5, height, 10, 0]

describe('simplifyLine', () => {
  it.each([
    ['drops', 0.9, [0, 0, 10, 0]],
    ['keeps', 1.1, lineWithBump(1.1)],
  ])('%s a point %s from the line when the tolerance is 1', (_verb, height, expected) => {
    expect(simplifyLine(lineWithBump(height), TOLERANCE)).toEqual(expected)
  })

  it('keeps both ends of a closed ring, so it stays closed', () => {
    const ring = [0, 0, 10, 0, 10, 10, 0, 10, 0, 0]
    expect(simplifyLine(ring, TOLERANCE)).toEqual(ring)
  })

  it('leaves lines too short to simplify alone', () => {
    expect(simplifyLine([0, 0, 1, 1], TOLERANCE)).toEqual([0, 0, 1, 1])
  })
})
