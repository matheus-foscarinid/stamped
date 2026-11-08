import { describe, expect, it, vi } from 'vitest'
import { deleteMe, readMe, replaceMyPlaces, updateMyPreferences } from './me-routes.ts'
import {
  buildRequest,
  countRepositoryCalls,
  createFakeRepository,
  createSignedInFake,
  readSetCookieValues,
} from './test/fakes.ts'

const PLACES = { kind: 'country', visited: ['br'], wishlist: ['is'] }
const MALFORMED_COOKIE = { a: '%E0%A4%A' }
const EXPIRED = new Date(Date.now() - 1000)

const READ_ACCOUNT = {
  name: 'read the account',
  route: readMe,
  method: 'GET',
  path: '/api/me',
  body: undefined,
}
const SAVE_COUNTRIES = {
  name: 'save countries',
  route: replaceMyPlaces,
  method: 'PUT',
  path: '/api/me/places',
  body: PLACES,
  written: 'replaceCountries',
} as const
const SAVE_PREFERENCES = {
  name: 'save preferences',
  route: updateMyPreferences,
  method: 'PATCH',
  path: '/api/me/preferences',
  body: { theme: 'dracula' },
  written: 'writePreferences',
} as const
const DELETE_ACCOUNT = {
  name: 'delete the account',
  route: deleteMe,
  method: 'DELETE',
  path: '/api/me',
  body: {},
  written: 'deleteUser',
} as const
const MUTATIONS = [SAVE_COUNTRIES, SAVE_PREFERENCES, DELETE_ACCOUNT]

const SESSIONS_THAT_NO_LONGER_COUNT = [
  {
    name: 'a session whose user is gone',
    setup: async () => {
      const fake = await createSignedInFake()
      fake.users.clear()
      return fake
    },
  },
  { name: 'an expired session', setup: () => createSignedInFake({ expiresAt: EXPIRED }) },
  {
    name: 'only a malformed cookie',
    setup: async () => ({ ...createFakeRepository(), cookies: MALFORMED_COOKIE }),
  },
]

describe('signed out', () => {
  it.each([READ_ACCOUNT, ...MUTATIONS])(
    'cannot $name and drops the signed-in hint',
    async ({ route, method, path, body }) => {
      const { repository } = createFakeRepository()

      const response = await route(buildRequest(path, { method, body }), repository)

      expect(response.status).toBe(401)
      expect(readSetCookieValues(response).stamped_signed_in).toBe('')
    }
  )

  it.each(SESSIONS_THAT_NO_LONGER_COUNT)('reads $name as signed out', async ({ setup }) => {
    const { repository, cookies } = await setup()

    const response = await readMe(buildRequest('/api/me', { cookies }), repository)

    expect(response.status).toBe(401)
  })
})

describe('signed in', () => {
  it.each([
    ['the session cookie', {}],
    ['the session cookie next to a malformed one', MALFORMED_COOKIE],
  ])('reads the account from %s in one uncached call', async (_case, extraCookies) => {
    const { repository, cookies } = await createSignedInFake()
    vi.clearAllMocks()

    const response = await readMe(
      buildRequest('/api/me', { cookies: { ...extraCookies, ...cookies } }),
      repository
    )

    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toMatchObject({ user: { email: 'traveller@example.com' } })
    expect(countRepositoryCalls(repository)).toBe(1)
  })

  it.each([
    {
      name: 'only preferences stay unsaved, with just the field sent',
      target: SAVE_PREFERENCES,
      account: { preferences: { theme: 'dracula', cover: null }, hasSavedData: false },
    },
    {
      name: 'countries are saved as validated, not as sent',
      target: SAVE_COUNTRIES,
      body: { kind: 'country', visited: ['br', 'br'], wishlist: ['br', 'is'] },
      account: { places: { country: { visited: ['br'], wishlist: ['is'] } }, hasSavedData: true },
    },
  ])('after a write, $name', async ({ target, body = target.body, account }) => {
    const { repository, cookies } = await createSignedInFake()
    const { route, method, path } = target

    await route(buildRequest(path, { method, cookies, body }), repository)
    const response = await readMe(buildRequest('/api/me', { cookies }), repository)

    expect(await response.json()).toMatchObject(account)
  })

  it.each([
    {
      name: 'countries it does not know',
      target: SAVE_COUNTRIES,
      body: { ...PLACES, visited: ['zz'] },
    },
    {
      name: 'a preference value it does not know',
      target: SAVE_PREFERENCES,
      body: { theme: 'neon' },
    },
    { name: 'a body that is not json', target: SAVE_COUNTRIES, rawBody: '{"kind":' },
  ])('refuses $name', async ({ target, ...payload }) => {
    const { repository, cookies } = await createSignedInFake()
    const { route, method, path, written } = target

    const response = await route(buildRequest(path, { method, cookies, ...payload }), repository)

    expect(response.status).toBe(400)
    expect(repository[written]).not.toHaveBeenCalled()
  })

  it('deletes the account with its sessions and clears the cookies', async () => {
    const { repository, users, sessions, cookies } = await createSignedInFake()
    const request = buildRequest('/api/me', { method: 'DELETE', cookies, body: {} })

    const response = await deleteMe(request, repository)

    expect(response.status).toBe(204)
    expect([users.size, sessions.size]).toEqual([0, 0])
    expect(readSetCookieValues(response).stamped_session).toBe('')
  })
})

describe('cross-origin', () => {
  describe.each(MUTATIONS)('to $name', ({ route, method, path, body, written }) => {
    it.each([
      ['from another site', { origin: 'https://evil.test' }],
      ['without an origin', { origin: null }],
      ['without a json body', { body: undefined }],
    ])('refuses a change %s', async (_case, override) => {
      const { repository, cookies } = await createSignedInFake()
      const request = buildRequest(path, { method, cookies, body, ...override })

      const response = await route(request, repository)

      expect(response.status).toBe(403)
      expect(repository[written]).not.toHaveBeenCalled()
    })
  })
})
