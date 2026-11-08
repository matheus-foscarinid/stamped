import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildAccount,
  stubAccountPage,
  stubBlockedStorage,
  stubSavedPage,
} from '@/test/browser-stubs'
import { mountComposable } from '@/test/composables'

// the cover lives in module state, so every test imports a fresh copy
const importCover = async () => {
  const { usePassportCover } = await import('./usePassportCover.ts')
  return mountComposable(usePassportCover).result
}

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('before a cover is picked', () => {
  it.each([
    ['the saved cover', 'teal', 'teal'],
    ['burgundy when nothing valid was saved', 'plaid', 'burgundy'],
  ])('starts on %s', async (_, saved, expected) => {
    stubSavedPage({ 'stamped-cover': saved })
    expect((await importCover()).cover.value).toBe(expected)
  })
})

describe('after a cover is picked', () => {
  it('wears it on the page and saves it', async () => {
    const { root, saved } = stubSavedPage()
    ;(await importCover()).setCover('navy')
    expect(root.dataset.cover).toBe('navy')
    expect(saved.get('stamped-cover')).toBe('navy')
  })

  it('still wears it when storage is blocked', async () => {
    const { root } = stubSavedPage()
    stubBlockedStorage()
    ;(await importCover()).setCover('black')
    expect(root.dataset.cover).toBe('black')
  })
})

describe('when the account has a cover', () => {
  it('wears it before the passport is ever opened', async () => {
    const page = stubAccountPage({ account: buildAccount({ preferences: { cover: 'navy' } }) })
    await import('./usePassportCover.ts')
    const { loadAccount } = await import('@/account/account')

    await loadAccount()

    expect(page.root.dataset.cover).toBe('navy')
  })
})
