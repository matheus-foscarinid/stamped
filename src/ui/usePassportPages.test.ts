import { afterEach, describe, expect, it, vi } from 'vitest'
import { shallowRef } from 'vue'
import { stubPageTrack } from '@/test/browser-stubs'
import { mountComposable } from '@/test/composables'
import { usePassportPages } from './usePassportPages.ts'

const mountPages = (pageCount: number) => {
  const stub = stubPageTrack({ pageCount })
  const track = shallowRef<HTMLElement | null>(null)
  const mounted = mountComposable(() => usePassportPages({ track }))
  track.value = stub.track as unknown as HTMLElement
  return { ...stub, ...mounted }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('when the book opens', () => {
  it('starts on the first spread and counts them all', async () => {
    const { result } = mountPages(3)
    await Promise.resolve()
    expect([result.spreadIndex.value, result.spreadCount.value]).toEqual([0, 3])
  })
})

describe('turning pages', () => {
  it('follows the buttons and stops at the last spread', async () => {
    const { result } = mountPages(3)
    await Promise.resolve()
    result.turnBy(1)
    result.turnBy(1)
    result.turnBy(1)
    expect(result.spreadIndex.value).toBe(2)
    result.turnBy(-1)
    expect(result.spreadIndex.value).toBe(1)
  })

  it('turns with the arrow keys, but not while typing in the search', async () => {
    const { result, pressKey, searchField } = mountPages(3)
    await Promise.resolve()
    pressKey('ArrowRight')
    expect(result.spreadIndex.value).toBe(1)
    pressKey('ArrowRight', searchField)
    expect(result.spreadIndex.value).toBe(1)
    pressKey('ArrowLeft')
    expect(result.spreadIndex.value).toBe(0)
  })

  it('stops listening for keys once the book closes', async () => {
    const { result, pressKey, unmount } = mountPages(3)
    await Promise.resolve()
    unmount()
    pressKey('ArrowRight')
    expect(result.spreadIndex.value).toBe(0)
  })
})
