import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { stubAddressBar, stubBlockedStorage, stubStorage } from '@/test/browser-stubs'
import { mountComposable } from '@/test/composables'
import { useCountryLists } from './useCountryLists.ts'

const SHARED_LINK = '#v=br,jp&w=is'
const QUERY = '?ref=friend'
const VISITED_KEY = 'stamped-visited'
const WISHLIST_KEY = 'stamped-wishlist'
const SAVED_MAP = { [VISITED_KEY]: 'pt,es', [WISHLIST_KEY]: 'nz' }
const EDITED_LISTS = { visited: ['br', 'jp', 'pt'], wishlist: ['is'] } as const

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('when the page opens', () => {
  it('starts from both lists in the link, even with a saved map', () => {
    stubAddressBar({ hash: SHARED_LINK })
    stubStorage(SAVED_MAP)
    expect(mountComposable(useCountryLists).result.lists.value).toEqual({
      visited: ['br', 'jp'],
      wishlist: ['is'],
    })
  })

  it('follows a link with only a wishlist instead of the saved map', () => {
    stubAddressBar({ hash: '#w=is' })
    stubStorage(SAVED_MAP)
    expect(mountComposable(useCountryLists).result.lists.value).toEqual({
      visited: [],
      wishlist: ['is'],
    })
  })

  it('restores the saved map and puts it in the link when the link has none', () => {
    const { replaceState } = stubAddressBar()
    stubStorage(SAVED_MAP)
    expect(mountComposable(useCountryLists).result.lists.value).toEqual({
      visited: ['pt', 'es'],
      wishlist: ['nz'],
    })
    expect(replaceState).toHaveBeenCalledWith(null, '', '/#v=pt,es&w=nz')
  })

  it('skips saved codes that are no longer countries', () => {
    stubAddressBar()
    stubStorage({ [VISITED_KEY]: 'pt,zz,PT, es' })
    expect(mountComposable(useCountryLists).result.lists.value).toEqual({
      visited: ['pt', 'es'],
      wishlist: [],
    })
  })

  it('starts empty when storage is blocked', () => {
    stubAddressBar()
    stubBlockedStorage()
    expect(mountComposable(useCountryLists).result.lists.value).toEqual({
      visited: [],
      wishlist: [],
    })
  })
})

describe('after the lists are edited', () => {
  it('rewrites the hash in place and keeps the path and query', async () => {
    const { replaceState } = stubAddressBar({ hash: SHARED_LINK, search: QUERY })
    stubStorage()
    mountComposable(useCountryLists).result.setLists(EDITED_LISTS)
    await nextTick()
    expect(replaceState).toHaveBeenCalledWith(null, '', `/${QUERY}#v=br,jp,pt&w=is`)
  })

  it('saves both lists', () => {
    stubAddressBar({ hash: SHARED_LINK })
    const { values } = stubStorage(SAVED_MAP)
    mountComposable(useCountryLists).result.setLists(EDITED_LISTS)
    expect(values.get(VISITED_KEY)).toBe('br,jp,pt')
    expect(values.get(WISHLIST_KEY)).toBe('is')
  })

  it('drops the hash and the saved map once both lists are empty', async () => {
    const { replaceState } = stubAddressBar({ hash: SHARED_LINK })
    const { values } = stubStorage(SAVED_MAP)
    mountComposable(useCountryLists).result.setLists({ visited: [], wishlist: [] })
    await nextTick()
    expect(replaceState).toHaveBeenLastCalledWith(null, '', '/')
    expect(values.get(VISITED_KEY)).toBe('')
    expect(values.get(WISHLIST_KEY)).toBe('')
  })

  it('still updates the map when storage is blocked', () => {
    stubAddressBar()
    stubBlockedStorage()
    const { lists, setLists } = mountComposable(useCountryLists).result
    setLists(EDITED_LISTS)
    expect(lists.value).toEqual(EDITED_LISTS)
  })
})

describe('after someone pastes a link', () => {
  it('follows the new link', () => {
    const { pasteLink } = stubAddressBar({ hash: SHARED_LINK })
    stubStorage()
    const { lists } = mountComposable(useCountryLists).result
    pasteLink('#v=ke&w=tz')
    expect(lists.value).toEqual({ visited: ['ke'], wishlist: ['tz'] })
  })

  it('keeps the saved map, since only edits are saved', () => {
    const { pasteLink } = stubAddressBar({ hash: SHARED_LINK })
    const { values } = stubStorage(SAVED_MAP)
    mountComposable(useCountryLists)
    pasteLink('#v=ke')
    expect(values.get(VISITED_KEY)).toBe('pt,es')
    expect(values.get(WISHLIST_KEY)).toBe('nz')
  })

  it('stops listening once the page is gone', () => {
    const { pasteLink } = stubAddressBar({ hash: SHARED_LINK })
    stubStorage()
    const { result, unmount } = mountComposable(useCountryLists)
    unmount()
    pasteLink('#v=ke')
    expect(result.lists.value.visited).toEqual(['br', 'jp'])
  })
})
