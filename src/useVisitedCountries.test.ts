import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { stubAddressBar, stubBlockedStorage, stubStorage } from '@/test/browser-stubs'
import { mountComposable } from '@/test/composables'
import { useVisitedCountries } from './useVisitedCountries.ts'

const SHARED_LINK = '#v=br,jp'
const QUERY = '?ref=friend'
const STORAGE_KEY = 'stamped-visited'
const SAVED_MAP = { [STORAGE_KEY]: 'pt,es' }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('when the page opens', () => {
  it('starts from the countries in the link, even with a saved map', () => {
    stubAddressBar({ hash: SHARED_LINK })
    stubStorage(SAVED_MAP)
    expect(mountComposable(useVisitedCountries).result.visited.value).toEqual(['br', 'jp'])
  })

  it('restores the saved map and puts it in the link when the link has none', () => {
    const { replaceState } = stubAddressBar()
    stubStorage(SAVED_MAP)
    expect(mountComposable(useVisitedCountries).result.visited.value).toEqual(['pt', 'es'])
    expect(replaceState).toHaveBeenCalledWith(null, '', '/#v=pt,es')
  })

  it('skips saved codes that are no longer countries', () => {
    stubAddressBar()
    stubStorage({ [STORAGE_KEY]: 'pt,zz,PT, es' })
    expect(mountComposable(useVisitedCountries).result.visited.value).toEqual(['pt', 'es'])
  })

  it('starts empty when storage is blocked', () => {
    stubAddressBar()
    stubBlockedStorage()
    expect(mountComposable(useVisitedCountries).result.visited.value).toEqual([])
  })
})

describe('after the visited list is edited', () => {
  it('rewrites the hash in place and keeps the path and query', async () => {
    const { replaceState } = stubAddressBar({ hash: SHARED_LINK, search: QUERY })
    stubStorage()
    mountComposable(useVisitedCountries).result.setVisited(['br', 'jp', 'pt'])
    await nextTick()
    expect(replaceState).toHaveBeenCalledWith(null, '', `/${QUERY}#v=br,jp,pt`)
  })

  it('saves the edit', () => {
    stubAddressBar({ hash: SHARED_LINK })
    const { values } = stubStorage(SAVED_MAP)
    mountComposable(useVisitedCountries).result.setVisited(['br', 'jp', 'pt'])
    expect(values.get(STORAGE_KEY)).toBe('br,jp,pt')
  })

  it('drops the hash and the saved map once nothing is visited', async () => {
    const { replaceState } = stubAddressBar({ hash: SHARED_LINK })
    const { values } = stubStorage(SAVED_MAP)
    mountComposable(useVisitedCountries).result.setVisited([])
    await nextTick()
    expect(replaceState).toHaveBeenLastCalledWith(null, '', '/')
    expect(values.get(STORAGE_KEY)).toBe('')
  })

  it('still updates the map when storage is blocked', () => {
    stubAddressBar()
    stubBlockedStorage()
    const { visited, setVisited } = mountComposable(useVisitedCountries).result
    setVisited(['ke'])
    expect(visited.value).toEqual(['ke'])
  })
})

describe('after someone pastes a link', () => {
  it('follows the new link', () => {
    const { pasteLink } = stubAddressBar({ hash: SHARED_LINK })
    stubStorage()
    const { visited } = mountComposable(useVisitedCountries).result
    pasteLink('#v=ke')
    expect(visited.value).toEqual(['ke'])
  })

  it('keeps the saved map, since only edits are saved', () => {
    const { pasteLink } = stubAddressBar({ hash: SHARED_LINK })
    const { values } = stubStorage(SAVED_MAP)
    mountComposable(useVisitedCountries)
    pasteLink('#v=ke')
    expect(values.get(STORAGE_KEY)).toBe('pt,es')
  })

  it('stops listening once the page is gone', () => {
    const { pasteLink } = stubAddressBar({ hash: SHARED_LINK })
    stubStorage()
    const { result, unmount } = mountComposable(useVisitedCountries)
    unmount()
    pasteLink('#v=ke')
    expect(result.visited.value).toEqual(['br', 'jp'])
  })
})
