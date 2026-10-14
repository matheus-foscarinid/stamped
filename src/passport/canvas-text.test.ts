import { describe, expect, it } from 'vitest'
import { wrapLines } from './canvas-text.ts'

const measureByLength = (line: string) => line.length

describe('wrapLines', () => {
  it('fills each line before starting the next', () => {
    expect(wrapLines('one two three four', 9, measureByLength)).toEqual([
      'one two',
      'three',
      'four',
    ])
  })

  it('gives a word wider than the line a line of its own', () => {
    expect(wrapLines('a Herzegovina b', 5, measureByLength)).toEqual(['a', 'Herzegovina', 'b'])
  })

  it('returns no lines for empty text', () => {
    expect(wrapLines('', 10, measureByLength)).toEqual([])
  })
})
