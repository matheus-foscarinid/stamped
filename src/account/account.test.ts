import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CountryCode, CountryLists } from '@/countries'
import { buildAccount, stubAccountPage } from '@/test/browser-stubs'
import { mountComposable } from '@/test/composables'
import type { PlaceLists } from './contract.ts'

const PLACES_URL = '/api/me/places'
const PREFERENCES_URL = '/api/me/preferences'
const SAVED_MAP = { 'stamped-visited': 'pt,es', 'stamped-wishlist': 'nz' }
const ACCOUNT_MAP: PlaceLists<CountryCode> = { visited: ['br', 'jp'], wishlist: ['is'] }
const OTHER_DEVICE_MAP: PlaceLists<CountryCode> = { visited: ['br', 'jp', 'mx'], wishlist: [] }
const FIRST_EDIT: CountryLists = { visited: ['br'], wishlist: [] }
const SECOND_EDIT: CountryLists = { visited: ['br', 'fr'], wishlist: [] }
const FRIEND_LINK = '#v=ar,cl'
const REFRESH_AFTER_MS = 60_000

const sentPlaces = (lists: CountryLists) => ({ kind: 'country', ...lists })

// the account lives in module state, so every test starts from a fresh copy
let account: typeof import('./account.ts')
let useCountryLists: typeof import('@/useCountryLists').useCountryLists

const mountLists = () => mountComposable(useCountryLists).result

beforeEach(async () => {
  vi.resetModules()
  vi.useFakeTimers()
  account = await import('./account.ts')
  ;({ useCountryLists } = await import('@/useCountryLists'))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('when signed out', () => {
  it('never asks for an account', async () => {
    const page = stubAccountPage({ isSignedIn: false })
    await account.loadAccount()
    expect(page.fetch).not.toHaveBeenCalled()
  })

  it('shows a failed sign-in once and drops it from the address bar', async () => {
    const page = stubAccountPage({ isSignedIn: false, search: '?signin=failed', hash: '#v=br' })
    await account.loadAccount()
    expect(account.useAccount().problem.value).toBe('signInFailed')
    expect(page.replaceState).toHaveBeenCalledWith(null, '', '/#v=br')
  })
})

describe('while the account loads', () => {
  it('goes back to signed out without a warning when the session has ended', async () => {
    stubAccountPage({ account: null })
    await account.loadAccount()
    expect(account.useAccount().user.value).toBeNull()
    expect(account.useAccount().problem.value).toBeNull()
  })

  it('flags a failed load and keeps working', async () => {
    const page = stubAccountPage()
    page.fetch.mockResolvedValueOnce(new Response(null, { status: 500 }))
    await account.loadAccount()
    expect(account.useAccount().problem.value).toBe('syncFailed')
  })

  it('waits for the page before showing the account', async () => {
    stubAccountPage({ account: buildAccount({ places: { country: ACCOUNT_MAP } }) })
    const { lists } = mountLists()
    let markPageReady = () => {}
    const loading = account.loadAccount(new Promise<void>(resolve => (markPageReady = resolve)))

    await vi.runAllTimersAsync()
    expect(lists.value).toEqual({ visited: [], wishlist: [] })
    markPageReady()
    await loading
    expect(lists.value).toEqual(ACCOUNT_MAP)
  })

  it('keeps an edit made before the account answered, and saves it', async () => {
    const page = stubAccountPage({ account: buildAccount({ places: { country: ACCOUNT_MAP } }) })
    const { lists, setLists } = mountLists()

    const loading = account.loadAccount()
    setLists(FIRST_EDIT)
    await loading
    await vi.runAllTimersAsync()

    expect(lists.value).toEqual(FIRST_EDIT)
    expect(page.readSent(PLACES_URL)).toEqual([sentPlaces(FIRST_EDIT)])
  })
})

describe('when the account has a saved map', () => {
  it('replaces the map in this browser and saves it locally', async () => {
    const page = stubAccountPage({
      saved: SAVED_MAP,
      account: buildAccount({ places: { country: ACCOUNT_MAP } }),
    })
    const { lists } = mountLists()

    await account.loadAccount()
    await vi.runAllTimersAsync()

    expect(lists.value).toEqual(ACCOUNT_MAP)
    expect(page.values.get('stamped-visited')).toBe('br,jp')
    expect(page.readSent(PLACES_URL)).toEqual([])
  })

  it("keeps a friend's map on screen and leaves the account alone", async () => {
    const page = stubAccountPage({
      hash: FRIEND_LINK,
      saved: SAVED_MAP,
      account: buildAccount({ places: { country: ACCOUNT_MAP } }),
    })
    const { lists } = mountLists()

    await account.loadAccount()
    await vi.runAllTimersAsync()

    expect(lists.value).toEqual({ visited: ['ar', 'cl'], wishlist: [] })
    expect(page.readSent(PLACES_URL)).toEqual([])
  })
})

describe('when the account is new', () => {
  it("takes this browser's map instead of wiping it", async () => {
    const page = stubAccountPage({
      saved: SAVED_MAP,
      account: buildAccount({ hasSavedData: false }),
    })
    const { lists } = mountLists()

    await account.loadAccount()
    await vi.runAllTimersAsync()

    expect(lists.value).toEqual({ visited: ['pt', 'es'], wishlist: ['nz'] })
    expect(page.readSent(PLACES_URL)).toEqual([sentPlaces(lists.value)])
  })

  it('sends nothing when this browser has no map either', async () => {
    const page = stubAccountPage({ account: buildAccount({ hasSavedData: false }) })
    mountLists()

    await account.loadAccount()
    await vi.runAllTimersAsync()

    expect(page.fetch).toHaveBeenCalledOnce()
  })
})

describe('after an edit', () => {
  const signIn = async () => {
    const page = stubAccountPage({ account: buildAccount({ places: { country: ACCOUNT_MAP } }) })
    const { setLists } = mountLists()
    await account.loadAccount()
    return { page, setLists }
  }

  it('sends a burst of edits as one save', async () => {
    const { page, setLists } = await signIn()

    setLists(FIRST_EDIT)
    setLists(SECOND_EDIT)
    await vi.runAllTimersAsync()

    expect(page.readSent(PLACES_URL)).toEqual([sentPlaces(SECOND_EDIT)])
  })

  it('holds the next save until the one in flight lands, so they never cross', async () => {
    const { page, setLists } = await signIn()
    let landFirstSave = () => {}
    page.fetch.mockImplementationOnce(
      () => new Promise(resolve => (landFirstSave = () => resolve(new Response(null))))
    )

    setLists(FIRST_EDIT)
    await vi.runAllTimersAsync()
    setLists(SECOND_EDIT)
    await vi.runAllTimersAsync()
    expect(page.readSent(PLACES_URL)).toEqual([sentPlaces(FIRST_EDIT)])

    landFirstSave()
    await vi.runAllTimersAsync()
    expect(page.readSent(PLACES_URL)).toEqual([sentPlaces(FIRST_EDIT), sentPlaces(SECOND_EDIT)])
  })

  it('flags a failed save, keeps the map here and retries when the page is left', async () => {
    const { page, setLists } = await signIn()
    page.fetch.mockResolvedValueOnce(new Response(null, { status: 500 }))

    setLists(FIRST_EDIT)
    await vi.runAllTimersAsync()
    page.leavePage()
    await vi.runAllTimersAsync()

    expect(account.useAccount().problem.value).toBe('syncFailed')
    expect(page.values.get('stamped-visited')).toBe('br')
    expect(page.readSent(PLACES_URL)).toEqual([sentPlaces(FIRST_EDIT), sentPlaces(FIRST_EDIT)])
  })

  it.each([
    ['the tab is hidden', 'hidePage'],
    ['the page is left', 'leavePage'],
  ] as const)('sends the last edit right away when %s', async (_, leave) => {
    const { page, setLists } = await signIn()

    setLists(FIRST_EDIT)
    page[leave]()
    await vi.advanceTimersByTimeAsync(0)

    const [, init] = page.fetch.mock.calls.at(-1) ?? []
    expect(init).toMatchObject({ method: 'PUT', keepalive: true })
  })

  it('goes back to signed out when a save finds the session gone', async () => {
    const { page, setLists } = await signIn()
    page.fetch.mockResolvedValueOnce(new Response(null, { status: 401 }))

    setLists(FIRST_EDIT)
    await vi.runAllTimersAsync()

    expect(account.useAccount().user.value).toBeNull()
    expect(account.useAccount().problem.value).toBeNull()
  })
})

describe('when the tab comes back', () => {
  it('shows edits made on another device', async () => {
    const page = stubAccountPage({ account: buildAccount({ places: { country: ACCOUNT_MAP } }) })
    const { lists } = mountLists()
    await account.loadAccount()

    page.changeAccount(buildAccount({ places: { country: OTHER_DEVICE_MAP } }))
    await vi.advanceTimersByTimeAsync(REFRESH_AFTER_MS)
    page.showPage()
    await vi.runAllTimersAsync()

    expect(lists.value).toEqual(OTHER_DEVICE_MAP)
  })

  it('keeps an edit that is still waiting to be saved', async () => {
    const page = stubAccountPage({ account: buildAccount({ places: { country: ACCOUNT_MAP } }) })
    const { lists, setLists } = mountLists()
    await account.loadAccount()

    page.changeAccount(buildAccount({ places: { country: OTHER_DEVICE_MAP } }))
    vi.setSystemTime(Date.now() + REFRESH_AFTER_MS)
    setLists(FIRST_EDIT)
    page.showPage()
    await vi.runAllTimersAsync()

    expect(lists.value).toEqual(FIRST_EDIT)
  })
})

describe('leaving the account', () => {
  it('saves the last edit before signing out', async () => {
    const page = stubAccountPage({ account: buildAccount({ places: { country: ACCOUNT_MAP } }) })
    const { setLists } = mountLists()
    await account.loadAccount()

    setLists(FIRST_EDIT)
    await account.useAccount().signOut()

    const sentUrls = page.fetch.mock.calls.filter(([, init]) => init?.method).map(([url]) => url)
    expect(sentUrls).toEqual([PLACES_URL, '/api/auth/logout'])
    expect(account.useAccount().user.value).toBeNull()
  })

  it('stays signed in when the sign out fails', async () => {
    const page = stubAccountPage()
    await account.loadAccount()
    page.fetch.mockResolvedValueOnce(new Response(null, { status: 500 }))

    await account.useAccount().signOut()

    expect(account.useAccount().user.value).not.toBeNull()
    expect(account.useAccount().problem.value).toBe('syncFailed')
  })

  it('drops an unsaved edit when the account is deleted', async () => {
    const page = stubAccountPage({ account: buildAccount({ places: { country: ACCOUNT_MAP } }) })
    const { setLists } = mountLists()
    await account.loadAccount()

    setLists(FIRST_EDIT)
    await account.useAccount().removeAccount()
    await vi.runAllTimersAsync()

    expect(page.readSent(PLACES_URL)).toEqual([])
    expect(account.useAccount().user.value).toBeNull()
  })
})

describe('preferences', () => {
  it('shows the one the account saved', async () => {
    stubAccountPage({ account: buildAccount({ preferences: { theme: 'dracula' } }) })
    const show = vi.fn()
    account.bindAccountPreference('theme', { readStored: () => 'rose', show })

    await account.loadAccount()

    expect(show).toHaveBeenCalledWith('dracula')
  })

  it("uploads this browser's pick when the account has none", async () => {
    const page = stubAccountPage()
    account.bindAccountPreference('theme', { readStored: () => 'rose', show: vi.fn() })

    await account.loadAccount()
    await vi.runAllTimersAsync()

    expect(page.readSent(PREFERENCES_URL)).toEqual([{ theme: 'rose' }])
  })

  it('keeps a pick made before the account answered', async () => {
    const page = stubAccountPage({ account: buildAccount({ preferences: { theme: 'dracula' } }) })
    const show = vi.fn()
    account.bindAccountPreference('theme', { readStored: () => 'ocean', show })

    const loading = account.loadAccount()
    account.syncPreference('theme', 'ocean')
    await loading
    await vi.runAllTimersAsync()

    expect(show).not.toHaveBeenCalled()
    expect(page.readSent(PREFERENCES_URL)).toEqual([{ theme: 'ocean' }])
  })

  it('catches up a picker that mounts after the account loaded', async () => {
    stubAccountPage({ account: buildAccount({ preferences: { cover: 'navy' } }) })
    await account.loadAccount()
    const show = vi.fn()

    account.bindAccountPreference('cover', { readStored: () => null, show })

    expect(show).toHaveBeenCalledWith('navy')
  })

  it('sends only what changed, several picks in one save', async () => {
    const page = stubAccountPage({ account: buildAccount({ preferences: { theme: 'rose' } }) })
    await account.loadAccount()

    account.syncPreference('theme', 'rose')
    account.syncPreference('theme', 'ocean')
    account.syncPreference('cover', 'navy')
    await vi.runAllTimersAsync()

    expect(page.readSent(PREFERENCES_URL)).toEqual([{ theme: 'ocean', cover: 'navy' }])
  })
})
