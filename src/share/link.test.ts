import { describe, expect, it } from 'vitest'
import { readListsFromHash, writeListsToHash } from './link.ts'

describe('readListsFromHash', () => {
  it('keeps tiny countries and skips codes outside the iso list', () => {
    expect(readListsFromHash('#v=va,zz&w=sm,qq')).toEqual({ visited: ['va'], wishlist: ['sm'] })
  })

  it('tolerates uppercase, spaces, repeats and junk from hand-edited links', () => {
    expect(readListsFromHash('#v=BR, br ,,zz,jp').visited).toEqual(['br', 'jp'])
  })

  it('finds both lists among other params', () => {
    expect(readListsFromHash('#ref=x&w=is&v=br,jp&utm=1')).toEqual({
      visited: ['br', 'jp'],
      wishlist: ['is'],
    })
  })

  it('keeps a country listed on both as visited only', () => {
    expect(readListsFromHash('#v=br&w=br,is')).toEqual({ visited: ['br'], wishlist: ['is'] })
  })

  it.each(['', '#', '#v=', '#w=', '#other=1'])('opens an empty map for %j', hash => {
    expect(readListsFromHash(hash)).toEqual({ visited: [], wishlist: [] })
  })
})

describe('writeListsToHash', () => {
  it('writes readable commas and round trips', () => {
    const lists = { visited: ['br', 'in'], wishlist: ['is', 'nz'] } as const
    const hash = writeListsToHash(lists)
    expect(hash).toBe('#v=br,in&w=is,nz')
    expect(readListsFromHash(hash)).toEqual(lists)
  })

  it('leaves out an empty list', () => {
    expect(writeListsToHash({ visited: [], wishlist: ['is'] })).toBe('#w=is')
    expect(writeListsToHash({ visited: ['br'], wishlist: [] })).toBe('#v=br')
  })

  it('clears the hash when both lists are empty', () => {
    expect(writeListsToHash({ visited: [], wishlist: [] })).toBe('')
  })
})
