import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { exchangeCode, readGoogleProfile } from './google.ts'
import {
  buildGoogleAuthUrl,
  buildIdToken,
  GOOGLE,
  ORIGIN,
  PROFILE,
  stubTokenEndpoint,
} from './test/fakes.ts'

const EXCHANGE = { config: GOOGLE, origin: ORIGIN, code: 'code', verifier: 'v' }

describe('buildAuthUrl', () => {
  it('carries the attempt state and the sha256 challenge of its verifier', () => {
    const { attempt, params } = buildGoogleAuthUrl()

    expect(params.get('state')).toBe(attempt.state)
    expect(params.get('code_challenge')).toBe(
      createHash('sha256').update(attempt.verifier).digest('base64url')
    )
  })
})

describe('readGoogleProfile', () => {
  it.each([
    ['a token meant for this app', {}],
    ['the issuer google also sends without a scheme', { iss: 'accounts.google.com' }],
  ])('reads the account from %s', (_case, claims) => {
    expect(readGoogleProfile(buildIdToken(claims), GOOGLE.clientId)).toEqual(PROFILE)
  })

  it('has no name or picture for an account that shares none', () => {
    const idToken = buildIdToken({ name: undefined, picture: undefined })

    expect(readGoogleProfile(idToken, GOOGLE.clientId)).toMatchObject({ name: null, picture: null })
  })

  it.each([
    ['another app', { aud: 'other-client' }],
    ['another issuer', { iss: 'https://evil.test' }],
    ['an unverified email', { email_verified: false }],
    ['no email', { email: undefined }],
    ['no subject', { sub: undefined }],
  ])('refuses a token for %s', (_case, claims) => {
    expect(() => readGoogleProfile(buildIdToken(claims), GOOGLE.clientId)).toThrow()
  })
})

describe('exchangeCode', () => {
  it('proves the attempt with the verifier and the redirect uri it started with', async () => {
    const fetchToken = stubTokenEndpoint()

    await exchangeCode(EXCHANGE, fetchToken)

    const body = fetchToken.mock.calls[0]?.[1]?.body as URLSearchParams
    expect(body.get('code_verifier')).toBe('v')
    expect(body.get('redirect_uri')).toBe(buildGoogleAuthUrl().params.get('redirect_uri'))
  })

  it('fails when google answers without an id token', async () => {
    const fetchToken = async () => Response.json({ access_token: 'x' })

    await expect(exchangeCode(EXCHANGE, fetchToken)).rejects.toThrow('no id token')
  })
})
