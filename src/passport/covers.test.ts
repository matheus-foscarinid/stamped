import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubBlockedStorage, stubStorage } from '@/test/browser-stubs'
import { DEFAULT_COVER, readStoredCover, storeCover } from './covers.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('readStoredCover', () => {
  it('returns the cover picked on an earlier visit', () => {
    stubStorage()
    storeCover('navy')
    expect(readStoredCover()).toBe('navy')
  })

  it('falls back to the default for a cover that no longer exists', () => {
    stubStorage({ 'stamped-cover': 'tartan' })
    expect(readStoredCover()).toBe(DEFAULT_COVER)
  })

  it('falls back to the default when storage is blocked', () => {
    stubBlockedStorage()
    expect(readStoredCover()).toBe(DEFAULT_COVER)
    expect(() => storeCover('teal')).not.toThrow()
  })
})
