import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountWithElement } from '@/test/composables'
import { stubPageTrack } from '@/test/layout-stubs'
import { usePassportPages } from './usePassportPages.ts'

interface MountPagesOptions {
  pageCount: number
}

const mountPages = async ({ pageCount }: MountPagesOptions) => {
  const stub = stubPageTrack({ pageCount })
  const { result, unmount } = mountWithElement(stub.track, track => usePassportPages({ track }))
  await Promise.resolve()
  return { ...stub, result, unmount }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('when the book opens', () => {
  it('starts on the first spread and counts them all', async () => {
    const { result } = await mountPages({ pageCount: 3 })
    expect([result.spreadIndex.value, result.spreadCount.value]).toEqual([0, 3])
  })

  it('counts again when a wider screen puts two pages on each spread', async () => {
    const { result, resizeTrack } = await mountPages({ pageCount: 4 })
    resizeTrack(2)
    expect(result.spreadCount.value).toBe(2)
  })
})

describe('turning pages', () => {
  it('follows the buttons and stops at the last spread', async () => {
    const { result } = await mountPages({ pageCount: 3 })
    result.turnBy(1)
    result.turnBy(1)
    result.turnBy(1)
    expect(result.spreadIndex.value).toBe(2)
    result.turnBy(-1)
    expect(result.spreadIndex.value).toBe(1)
  })

  it('turns with the arrow keys and keeps the key from scrolling the page', async () => {
    const { result, pressKey } = await mountPages({ pageCount: 3 })
    const press = pressKey({ key: 'ArrowRight' })
    expect(result.spreadIndex.value).toBe(1)
    expect(press.defaultPrevented).toBe(true)
  })

  it('leaves arrows alone while typing or inside a dialog', async () => {
    const { result, pressKey, searchField, dialogButton } = await mountPages({ pageCount: 3 })
    for (const target of [searchField, dialogButton]) {
      const press = pressKey({ key: 'ArrowRight', target })
      expect(press.defaultPrevented).toBe(false)
    }
    expect(result.spreadIndex.value).toBe(0)
  })

  it('leaves browser shortcuts like cmd+left alone', async () => {
    const { result, pressKey } = await mountPages({ pageCount: 3 })
    result.turnBy(1)
    const press = pressKey({ key: 'ArrowLeft', modifiers: { metaKey: true } })
    expect(press.defaultPrevented).toBe(false)
    expect(result.spreadIndex.value).toBe(1)
  })

  it('leaves arrows alone when there is no page to turn to', async () => {
    const { pressKey } = await mountPages({ pageCount: 1 })
    expect(pressKey({ key: 'ArrowRight' }).defaultPrevented).toBe(false)
    expect(pressKey({ key: 'ArrowLeft' }).defaultPrevented).toBe(false)
  })
})

describe('after the book closes', () => {
  it('stops listening for keys and resizes', async () => {
    const { result, pressKey, resizeTrack, unmount } = await mountPages({ pageCount: 4 })
    unmount()
    pressKey({ key: 'ArrowRight' })
    resizeTrack(2)
    expect([result.spreadIndex.value, result.spreadCount.value]).toEqual([0, 4])
  })
})
