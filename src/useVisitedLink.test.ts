import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { stubAddressBar } from '@/test/browser-stubs'
import { mountComposable } from '@/test/composables'
import { useVisitedLink } from './useVisitedLink.ts'

const SHARED_LINK = '#v=br,jp'
const QUERY = '?ref=friend'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('when the page opens', () => {
  it('starts from the countries in the link', () => {
    stubAddressBar({ hash: SHARED_LINK })
    expect(mountComposable(useVisitedLink).result.value).toEqual(['br', 'jp'])
  })
})

describe('after the visited list changes', () => {
  it('rewrites the hash in place and keeps the path and query', async () => {
    const { replaceState } = stubAddressBar({ hash: SHARED_LINK, search: QUERY })
    const { result: visited } = mountComposable(useVisitedLink)
    visited.value = ['br', 'jp', 'pt']
    await nextTick()
    expect(replaceState).toHaveBeenCalledWith(null, '', `/${QUERY}#v=br,jp,pt`)
  })

  it('drops the hash once nothing is visited', async () => {
    const { replaceState } = stubAddressBar({ hash: SHARED_LINK })
    const { result: visited } = mountComposable(useVisitedLink)
    visited.value = []
    await nextTick()
    expect(replaceState).toHaveBeenCalledWith(null, '', '/')
  })
})

describe('after someone pastes a link', () => {
  it('follows the new link', () => {
    const { pasteLink } = stubAddressBar({ hash: SHARED_LINK })
    const { result: visited } = mountComposable(useVisitedLink)
    pasteLink('#v=ke')
    expect(visited.value).toEqual(['ke'])
  })

  it('stops listening once the page is gone', () => {
    const { pasteLink } = stubAddressBar({ hash: SHARED_LINK })
    const { result: visited, unmount } = mountComposable(useVisitedLink)
    unmount()
    pasteLink('#v=ke')
    expect(visited.value).toEqual(['br', 'jp'])
  })
})
