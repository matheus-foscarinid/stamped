import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { stubAccountPage, stubBlockedStorage } from '@/test/browser-stubs'
import { mountComposable } from '@/test/composables'
import { useFirstRunGuide } from './useFirstRunGuide.ts'

const GUIDE_KEY = 'stamped-guide-hidden'
const PASSPORT_KEY = 'stamped-passport-seen'

interface MountGuideOptions {
  visitedCount?: number
  isPassportOpen?: boolean
}

const mountGuide = ({ visitedCount = 0, isPassportOpen = false }: MountGuideOptions = {}) => {
  const inputs = { visitedCount: ref(visitedCount), isPassportOpen: ref(isPassportOpen) }
  return { ...inputs, guide: mountComposable(() => useFirstRunGuide(inputs)).result }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('on a first visit', () => {
  it('shows the guide with nothing done', () => {
    stubAccountPage({ isSignedIn: false })
    const { guide } = mountGuide()

    expect(guide.isShown.value).toBe(true)
    expect(guide.doneCount.value).toBe(0)
  })

  it('ticks the stamp step once a country is visited', () => {
    stubAccountPage({ isSignedIn: false })
    const { guide, visitedCount } = mountGuide()

    visitedCount.value = 1

    expect(guide.steps.value.find(step => step.key === 'stamp')?.isDone).toBe(true)
  })

  it('steps aside while the passport is open and ticks it for later visits', async () => {
    const page = stubAccountPage({ isSignedIn: false })
    const { guide, isPassportOpen } = mountGuide()

    isPassportOpen.value = true
    await nextTick()

    expect(guide.isShown.value).toBe(false)
    expect(page.values.get(PASSPORT_KEY)).toBe('1')
    isPassportOpen.value = false
    expect(guide.isShown.value).toBe(true)
    expect(guide.doneCount.value).toBe(1)
  })
})

describe('once hidden', () => {
  it('stays hidden on the next visit', () => {
    const page = stubAccountPage({ isSignedIn: false })
    mountGuide().guide.hide()

    expect(page.values.get(GUIDE_KEY)).toBe('1')
    expect(mountGuide().guide.isShown.value).toBe(false)
  })
})

describe('when the guide has nothing to offer', () => {
  it('stays hidden for a signed-in visit', () => {
    stubAccountPage({ isSignedIn: true })
    expect(mountGuide().guide.isShown.value).toBe(false)
  })

  it('stays hidden when storage is blocked, rather than show on every visit', () => {
    stubAccountPage({ isSignedIn: false })
    stubBlockedStorage()
    expect(mountGuide().guide.isShown.value).toBe(false)
  })
})
