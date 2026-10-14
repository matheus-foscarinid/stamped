import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubBlockedStorage, stubStorage } from '@/test/browser-stubs'
import { mountComposable } from '@/test/composables'
import { useIntroDialog } from './useIntroDialog.ts'

const INTRO_KEY = 'stamped-intro-seen'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('on a first visit', () => {
  it('opens the intro', () => {
    stubStorage()
    expect(mountComposable(useIntroDialog).result.isOpen.value).toBe(true)
  })

  it('stays closed on the next visit once it is closed', () => {
    stubStorage()
    const { isOpen, close } = mountComposable(useIntroDialog).result
    close()
    expect(isOpen.value).toBe(false)
    expect(mountComposable(useIntroDialog).result.isOpen.value).toBe(false)
  })
})

describe('on a later visit', () => {
  it('keeps the intro closed', () => {
    stubStorage({ [INTRO_KEY]: '1' })
    expect(mountComposable(useIntroDialog).result.isOpen.value).toBe(false)
  })
})

describe('for someone who made a map before the intro existed', () => {
  it('keeps the intro closed', () => {
    stubStorage({ 'stamped-visited': 'br' })
    expect(mountComposable(useIntroDialog).result.isOpen.value).toBe(false)
  })

  it('keeps it closed for a saved wishlist too', () => {
    stubStorage({ 'stamped-wishlist': 'is' })
    expect(mountComposable(useIntroDialog).result.isOpen.value).toBe(false)
  })
})

describe('when storage is blocked', () => {
  it('skips the intro, since it would come back on every visit', () => {
    stubBlockedStorage()
    expect(mountComposable(useIntroDialog).result.isOpen.value).toBe(false)
  })
})
