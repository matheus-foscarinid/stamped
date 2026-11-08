import { type Mock, vi } from 'vitest'
import type { AccountPreferences, PlaceLists } from '../../src/account/contract.ts'
import type { CountryCode } from '../../src/countries/catalog.ts'
import { finishGoogleSignIn, startGoogleSignIn } from '../auth-routes.ts'
import type { Repository } from '../db.ts'
import { buildAuthUrl, createSignInAttempt, type GoogleProfile } from '../google.ts'
import { createSessionToken, hashSessionToken, SESSION_COOKIE } from '../session.ts'

export const ORIGIN = 'https://stamped.test'
export const GOOGLE = { clientId: 'client-id', clientSecret: 'client-secret' }

interface FakeUser {
  profile: GoogleProfile
  preferences: AccountPreferences
  countries: PlaceLists<CountryCode>
  hasSavedData: boolean
}

const EMPTY_PREFERENCES: AccountPreferences = { theme: null, cover: null, language: null }

type FakeUsers = Map<string, FakeUser>
type FakeSessions = Map<string, { userId: string; expiresAt: Date }>
type FakeRepository = { [Method in keyof Repository]: Mock<Repository[Method]> }

const findLiveSession = (sessions: FakeSessions, tokenHash: Buffer) => {
  const session = sessions.get(tokenHash.toString('hex'))
  return session && session.expiresAt > new Date() ? session : undefined
}

const toAccount = (user: FakeUser) => ({
  user: { email: user.profile.email, name: user.profile.name, avatarUrl: user.profile.picture },
  preferences: user.preferences,
  places: { country: user.countries },
  hasSavedData: user.hasSavedData,
})

const createNewUser = (profile: GoogleProfile): FakeUser => ({
  profile,
  preferences: EMPTY_PREFERENCES,
  countries: { visited: [], wishlist: [] },
  hasSavedData: false,
})

const fakeSessionMethods = (sessions: FakeSessions) => ({
  createSession: vi.fn<Repository['createSession']>(async ({ tokenHash, userId, expiresAt }) => {
    sessions.set(tokenHash.toString('hex'), { userId, expiresAt })
  }),
  findSessionUserId: vi.fn<Repository['findSessionUserId']>(
    async tokenHash => findLiveSession(sessions, tokenHash)?.userId ?? null
  ),
  deleteSession: vi.fn<Repository['deleteSession']>(async tokenHash => {
    sessions.delete(tokenHash.toString('hex'))
  }),
})

const fakeUserMethods = (users: FakeUsers, sessions: FakeSessions) => {
  const updateUser = (userId: string, change: Partial<FakeUser>) => {
    const user = users.get(userId)
    if (!user) throw new Error(`no user ${userId}`)
    users.set(userId, { ...user, ...change })
  }
  return {
    upsertGoogleUser: vi.fn<Repository['upsertGoogleUser']>(async profile => {
      const id = `user-${profile.sub}`
      const existing = users.get(id)
      users.set(id, existing ? { ...existing, profile } : createNewUser(profile))
      return id
    }),
    readSessionAccount: vi.fn<Repository['readSessionAccount']>(async tokenHash => {
      const session = findLiveSession(sessions, tokenHash)
      const user = session && users.get(session.userId)
      return user ? toAccount(user) : null
    }),
    replaceCountries: vi.fn<Repository['replaceCountries']>(async (userId, countries) =>
      updateUser(userId, { countries, hasSavedData: true })
    ),
    writePreferences: vi.fn<Repository['writePreferences']>(async (userId, preferences) =>
      updateUser(userId, {
        preferences: { ...(users.get(userId)?.preferences ?? EMPTY_PREFERENCES), ...preferences },
      })
    ),
    deleteUser: vi.fn<Repository['deleteUser']>(async userId => {
      users.delete(userId)
      for (const [hash, session] of sessions) if (session.userId === userId) sessions.delete(hash)
    }),
  }
}

export const createFakeRepository = () => {
  const users: FakeUsers = new Map()
  const sessions: FakeSessions = new Map()
  const repository: FakeRepository = {
    ...fakeSessionMethods(sessions),
    ...fakeUserMethods(users, sessions),
  }
  return { repository, users, sessions }
}

export const countRepositoryCalls = (repository: FakeRepository): number =>
  Object.values(repository).reduce((count, method) => count + method.mock.calls.length, 0)

export const PROFILE: GoogleProfile = {
  sub: '1234',
  email: 'traveller@example.com',
  name: 'Traveller',
  picture: 'https://example.com/avatar.png',
}

interface IdTokenClaims {
  aud?: string
  iss?: string
  email_verified?: boolean
  sub?: string | undefined
  email?: string | undefined
  name?: string | undefined
  picture?: string | undefined
}

export const buildIdToken = (claims: IdTokenClaims = {}) => {
  const payload = {
    aud: GOOGLE.clientId,
    iss: 'https://accounts.google.com',
    email_verified: true,
    sub: PROFILE.sub,
    email: PROFILE.email,
    name: PROFILE.name,
    picture: PROFILE.picture,
    ...claims,
  }
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'RS256' })}.${encode(payload)}.signature`
}

export const buildGoogleAuthUrl = () => {
  const attempt = createSignInAttempt()
  const url = new URL(buildAuthUrl({ clientId: GOOGLE.clientId, origin: ORIGIN, attempt }))
  return { attempt, params: url.searchParams }
}

export const loadFreshDependencies = async () => {
  vi.resetModules()
  return (await import('../env.ts')).getDependencies()
}

export const refuseTokenEndpoint = async () => new Response('{}', { status: 400 })

export const stubTokenEndpoint = (idToken = buildIdToken()) =>
  vi.fn<typeof fetch>(async () => Response.json({ id_token: idToken }))

interface RequestOptions {
  method?: string
  cookies?: Record<string, string>
  body?: unknown
  rawBody?: string
  origin?: string | null
}

export const buildRequest = (path: string, options: RequestOptions = {}) => {
  const { method = 'GET', cookies = {}, body, rawBody, origin = ORIGIN } = options
  const payload = rawBody ?? (body === undefined ? undefined : JSON.stringify(body))
  const headers = new Headers()
  const cookieHeader = Object.entries(cookies).map(([name, value]) => `${name}=${value}`)
  if (cookieHeader.length > 0) headers.set('cookie', cookieHeader.join('; '))
  if (origin) headers.set('origin', origin)
  if (payload !== undefined) headers.set('content-type', 'application/json')
  return new Request(`${ORIGIN}${path}`, {
    method,
    headers,
    ...(payload === undefined ? {} : { body: payload }),
  })
}

export const readSetCookieValues = (response: Response): Record<string, string> =>
  Object.fromEntries(
    response.headers.getSetCookie().map(cookie => {
      const [pair = ''] = cookie.split(';')
      const separator = pair.indexOf('=')
      return [pair.slice(0, separator), decodeURIComponent(pair.slice(separator + 1))]
    })
  )

interface FakeSessionOptions {
  profile?: GoogleProfile
  expiresAt?: Date
}

export const createSessionWithoutGoogle = async (
  repository: Repository,
  { profile = PROFILE, expiresAt = new Date(Date.now() + 60_000) }: FakeSessionOptions = {}
) => {
  const userId = await repository.upsertGoogleUser(profile)
  const token = createSessionToken()
  await repository.createSession({ tokenHash: hashSessionToken(token), userId, expiresAt })
  return { userId, cookies: { [SESSION_COOKIE]: token } }
}

export const createSignedInFake = async (options: FakeSessionOptions = {}) => {
  const fake = createFakeRepository()
  const { userId, cookies } = await createSessionWithoutGoogle(fake.repository, options)
  return { ...fake, userId, cookies }
}

interface AuthFakeOptions {
  idToken?: string
  fetchToken?: typeof fetch
}

export const createAuthFake = ({ idToken, fetchToken }: AuthFakeOptions = {}) => {
  const fake = createFakeRepository()
  const tokenEndpoint = fetchToken ? vi.fn<typeof fetch>(fetchToken) : stubTokenEndpoint(idToken)
  const deps = { repository: fake.repository, google: GOOGLE, fetchToken: tokenEndpoint }
  return { ...fake, deps, fetchToken: tokenEndpoint }
}

type AuthDeps = ReturnType<typeof createAuthFake>['deps']

export const startSignInAttempt = async (deps: AuthDeps) => {
  const response = await startGoogleSignIn(buildRequest('/api/auth/google'), deps)
  const location = new URL(response.headers.get('location') ?? '')
  const attemptCookie = readSetCookieValues(response).stamped_sign_in ?? ''
  return { response, state: location.searchParams.get('state') ?? '', attemptCookie }
}

interface CallbackOptions {
  query: string
  attemptCookie?: string | undefined
}

export const callBack = (deps: AuthDeps, { query, attemptCookie }: CallbackOptions) =>
  finishGoogleSignIn(
    buildRequest(`/api/auth/callback?${query}`, {
      cookies: attemptCookie ? { stamped_sign_in: attemptCookie } : {},
    }),
    deps
  )
