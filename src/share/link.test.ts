import { describe, expect, it } from 'vitest'
import { readVisitedFromHash, writeVisitedToHash } from './link.ts'

describe('readVisitedFromHash', () => {
  it('keeps tiny countries and skips codes outside the iso list', () => {
    expect(readVisitedFromHash('#v=va,xk')).toEqual(['va'])
  })

  it('tolerates uppercase, spaces, repeats and junk from hand-edited links', () => {
    expect(readVisitedFromHash('#v=BR, br ,,zz,jp')).toEqual(['br', 'jp'])
  })

  it('finds v among other params', () => {
    expect(readVisitedFromHash('#ref=x&v=br,jp&utm=1')).toEqual(['br', 'jp'])
  })

  it.each(['', '#', '#v=', '#other=1'])('opens an empty map for %j', hash => {
    expect(readVisitedFromHash(hash)).toEqual([])
  })
})

describe('writeVisitedToHash', () => {
  it('writes readable commas and round trips', () => {
    const hash = writeVisitedToHash(['br', 'in'])
    expect(hash).toBe('#v=br,in')
    expect(readVisitedFromHash(hash)).toEqual(['br', 'in'])
  })

  it('clears the hash when nothing is visited', () => {
    expect(writeVisitedToHash([])).toBe('')
  })
})
