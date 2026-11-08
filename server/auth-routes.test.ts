import { beforeEach, describe, expect, it, vi } from 'vitest'
import { signOut } from './auth-routes.ts'
import { hashSessionToken } from './session.ts'
import {
  buildRequest,
  callBack,
  createAuthFake,
  createSessionWithoutGoogle,
  readSetCookieValues,
  refuseTokenEndpoint,
  startSignInAttempt,
} from './test/fakes.ts'

const FAILED_REDIRECT = '/?signin=failed'
const OTHER_SITE = 'https://evil.test'

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

describe('a trusted callback', () => {
  it('starts at google', async () => {
    const { deps } = createAuthFake()

    const { response } = await startSignInAttempt(deps)

    expect(response.headers.get('location')).toMatch(/^https:\/\/accounts\.google\.com\//)
  })

  it('signs in with the code, the pkce verifier it kept, and a session for that user', async () => {
    const { deps, users, repository, fetchToken } = createAuthFake()
    const { state, attemptCookie } = await startSignInAttempt(deps)

    const response = await callBack(deps, { query: `code=abc&state=${state}`, attemptCookie })

    const sentBody = fetchToken.mock.calls[0]?.[1]?.body as URLSearchParams
    const cookies = readSetCookieValues(response)
    expect(response.headers.get('location')).toBe('/')
    expect(sentBody.get('code_verifier')).toBe(attemptCookie.split('.')[1])
    expect(cookies).toMatchObject({ stamped_signed_in: '1', stamped_sign_in: '' })
    const sessionUserId = await repository.findSessionUserId(
      hashSessionToken(cookies.stamped_session ?? '')
    )
    expect(sessionUserId).toBe([...users.keys()][0])
  })

  it('signs a returning visitor into the same account', async () => {
    const { deps, users, sessions } = createAuthFake()
    for (const _visit of [1, 2]) {
      const { state, attemptCookie } = await startSignInAttempt(deps)
      await callBack(deps, { query: `code=abc&state=${state}`, attemptCookie })
    }

    expect([users.size, sessions.size]).toEqual([1, 2])
  })
})

describe('a callback that cannot be trusted', () => {
  it.each([
    ['a state that is not the one it sent', () => 'code=abc&state=forged', true],
    ['no attempt cookie', (state: string) => `code=abc&state=${state}`, false],
    [
      'no code, because the visitor cancelled',
      (state: string) => `error=access_denied&state=${state}`,
      true,
    ],
  ])('stays signed out without asking google, with %s', async (_case, toQuery, hasAttempt) => {
    const { deps, users, fetchToken } = createAuthFake()
    const { state, attemptCookie } = await startSignInAttempt(deps)

    const response = await callBack(deps, {
      query: toQuery(state),
      attemptCookie: hasAttempt ? attemptCookie : undefined,
    })

    expect(response.headers.get('location')).toBe(FAILED_REDIRECT)
    expect(fetchToken).not.toHaveBeenCalled()
    expect(users.size).toBe(0)
  })

  it('stays signed out when google refuses the code', async () => {
    const { deps, users, sessions } = createAuthFake({ fetchToken: refuseTokenEndpoint })
    const { state, attemptCookie } = await startSignInAttempt(deps)

    const response = await callBack(deps, { query: `code=abc&state=${state}`, attemptCookie })

    expect(response.headers.get('location')).toBe(FAILED_REDIRECT)
    expect(readSetCookieValues(response).stamped_sign_in).toBe('')
    expect([users.size, sessions.size]).toEqual([0, 0])
  })
})

describe('sign out', () => {
  it('ends the session and clears both cookies', async () => {
    const { repository, sessions } = createAuthFake()
    const { cookies } = await createSessionWithoutGoogle(repository)
    const request = buildRequest('/api/auth/logout', { method: 'POST', cookies, body: {} })

    const response = await signOut(request, repository)

    expect(response.status).toBe(204)
    expect(sessions.size).toBe(0)
    expect(readSetCookieValues(response)).toEqual({ stamped_session: '', stamped_signed_in: '' })
  })

  it('ignores a sign out posted from another site', async () => {
    const { repository, sessions } = createAuthFake()
    const { cookies } = await createSessionWithoutGoogle(repository)
    const request = buildRequest('/api/auth/logout', {
      method: 'POST',
      cookies,
      body: {},
      origin: OTHER_SITE,
    })

    const response = await signOut(request, repository)

    expect(response.status).toBe(403)
    expect(sessions.size).toBe(1)
  })
})
