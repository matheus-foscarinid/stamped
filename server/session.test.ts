import { describe, expect, it } from 'vitest'
import {
  buildClearedSessionCookies,
  buildSessionCookies,
  createSessionToken,
  hashSessionToken,
  readCookies,
} from './session.ts'
import { buildRequest } from './test/fakes.ts'

describe('session cookies', () => {
  it('keeps the session token away from page scripts and only exposes the signed-in hint', () => {
    const [session, hint] = buildSessionCookies('token')

    expect(session).toContain('HttpOnly')
    expect(session).toContain('Secure')
    expect(session).toContain('SameSite=Lax')
    expect(hint).toMatch(/^stamped_signed_in=1;/)
    expect(hint).not.toContain('HttpOnly')
  })

  it('expires both cookies on sign out', () => {
    for (const cookie of buildClearedSessionCookies()) expect(cookie).toContain('Max-Age=0')
  })

  it.each([
    {
      name: 'reads every cookie, with an = inside a value',
      cookies: { stamped_session: 'abc', other: 'x=y' },
      expected: { stamped_session: 'abc', other: 'x=y' },
    },
    {
      name: 'drops a malformed cookie and keeps the rest',
      cookies: { a: '%E0%A4%A', stamped_session: 'abc' },
      expected: { stamped_session: 'abc' },
    },
  ])('$name', ({ cookies, expected }) => {
    const parsed = readCookies(buildRequest('/', { cookies }))

    expect(Object.fromEntries(parsed)).toEqual(expected)
  })
})

describe('session tokens', () => {
  it('hashes the same token the same way and other tokens differently', () => {
    const token = createSessionToken()

    expect(hashSessionToken(token)).toEqual(hashSessionToken(token))
    expect(hashSessionToken(token)).not.toEqual(hashSessionToken(createSessionToken()))
  })
})
