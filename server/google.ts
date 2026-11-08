import { createHash, randomBytes } from 'node:crypto'

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com']

export interface GoogleConfig {
  clientId: string
  clientSecret: string
}

export interface GoogleProfile {
  sub: string
  email: string
  name: string | null
  picture: string | null
}

export interface SignInAttempt {
  state: string
  verifier: string
}

export const createSignInAttempt = (): SignInAttempt => ({
  state: randomBytes(16).toString('base64url'),
  verifier: randomBytes(32).toString('base64url'),
})

const toChallenge = (verifier: string) => createHash('sha256').update(verifier).digest('base64url')

const getRedirectUri = (origin: string): string => `${origin}/api/auth/callback`

interface AuthUrlOptions {
  clientId: string
  origin: string
  attempt: SignInAttempt
}

export const buildAuthUrl = ({ clientId, origin, attempt }: AuthUrlOptions): string => {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(origin),
    response_type: 'code',
    scope: 'openid email profile',
    state: attempt.state,
    code_challenge: toChallenge(attempt.verifier),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  })
  return `${AUTH_URL}?${params}`
}

const decodeTokenPayload = (idToken: string): Record<string, unknown> => {
  const payload = idToken.split('.')[1]
  if (!payload) throw new Error('id token has no payload')
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
}

const readOptionalString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null

// the token comes straight from google's token endpoint over tls, so google allows
// skipping the signature check. the claims still have to be meant for this app
export const readGoogleProfile = (idToken: string, clientId: string): GoogleProfile => {
  const claims = decodeTokenPayload(idToken)
  if (claims.aud !== clientId) throw new Error('id token is for another app')
  if (!ISSUERS.includes(String(claims.iss))) throw new Error('id token is not from google')
  if (claims.email_verified !== true) throw new Error('google email is not verified')
  if (typeof claims.sub !== 'string' || typeof claims.email !== 'string') {
    throw new Error('id token misses the account fields')
  }
  return {
    sub: claims.sub,
    email: claims.email,
    name: readOptionalString(claims.name),
    picture: readOptionalString(claims.picture),
  }
}

interface CodeExchange {
  config: GoogleConfig
  origin: string
  code: string
  verifier: string
}

export const exchangeCode = async (
  { config, origin, code, verifier }: CodeExchange,
  fetchToken: typeof fetch = fetch
): Promise<GoogleProfile> => {
  const response = await fetchToken(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      code_verifier: verifier,
      grant_type: 'authorization_code',
      redirect_uri: getRedirectUri(origin),
    }),
  })
  if (!response.ok) throw new Error(`google token exchange failed with ${response.status}`)
  const { id_token: idToken } = (await response.json()) as { id_token?: unknown }
  if (typeof idToken !== 'string') throw new Error('google sent no id token')
  return readGoogleProfile(idToken, config.clientId)
}
