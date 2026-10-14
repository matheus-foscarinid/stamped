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

  it('remembers the intro once it is closed', () => {
    const { values } = stubStorage()
    const { isOpen, close } = mountComposable(useIntroDialog).result
    close()
    expect(isOpen.value).toBe(false)
    expect(values.has(INTRO_KEY)).toBe(true)
  })
})

describe('on a later visit', () => {
  it('keeps the intro closed', () => {
    stubStorage({ [INTRO_KEY]: '1' })
    expect(mountComposable(useIntroDialog).result.isOpen.value).toBe(false)
  })
})

describe('when storage is blocked', () => {
  it('skips the intro, since it would come back on every visit', () => {
    stubBlockedStorage()
    expect(mountComposable(useIntroDialog).result.isOpen.value).toBe(false)
  })
})
