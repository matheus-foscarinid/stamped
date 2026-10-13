import { describe, expect, it } from 'vitest'
import { readVisitedFromHash, writeVisitedToHash } from './link.ts'

describe('readVisitedFromHash', () => {
  it('reads the codes from a shared link', () => {
    expect(readVisitedFromHash('#v=ao,br,in,iq')).toEqual(['ao', 'br', 'in', 'iq'])
  })

  it('keeps tiny countries and skips codes outside the iso list', () => {
    expect(readVisitedFromHash('#v=va,xk')).toEqual(['va'])
  })

  it('tolerates uppercase, spaces, repeats and junk from hand-edited links', () => {
    expect(readVisitedFromHash('#v=BR, br ,,zz,jp')).toEqual(['br', 'jp'])
  })

  it('opens an empty map when there is no hash or no v param', () => {
    expect(readVisitedFromHash('')).toEqual([])
    expect(readVisitedFromHash('#other=1')).toEqual([])
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
