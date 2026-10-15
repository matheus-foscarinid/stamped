import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubBlockedStorage, stubSavedPage } from '@/test/browser-stubs'
import { mountComposable } from '@/test/composables'
import { usePassportCover } from './usePassportCover.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('before a cover is picked', () => {
  it('starts on the saved cover', () => {
    stubSavedPage({ 'stamped-cover': 'teal' })
    expect(mountComposable(usePassportCover).result.cover.value).toBe('teal')
  })

  it('starts on burgundy when nothing valid was saved', () => {
    stubSavedPage({ 'stamped-cover': 'plaid' })
    expect(mountComposable(usePassportCover).result.cover.value).toBe('burgundy')
  })
})

describe('after a cover is picked', () => {
  it('wears it on the page and saves it', () => {
    const { root, saved } = stubSavedPage()
    mountComposable(usePassportCover).result.setCover('navy')
    expect(root.dataset.cover).toBe('navy')
    expect(saved.get('stamped-cover')).toBe('navy')
  })

  it('still wears it when storage is blocked', () => {
    const { root } = stubSavedPage()
    stubBlockedStorage()
    mountComposable(usePassportCover).result.setCover('black')
    expect(root.dataset.cover).toBe('black')
  })
})
