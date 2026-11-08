import type { Repository } from './db.ts'
import {
  buildAuthUrl,
  createSignInAttempt,
  exchangeCode,
  type GoogleConfig,
  type SignInAttempt,
} from './google.ts'
import {
  getOrigin,
  isSameOriginJson,
  readSessionHash,
  respondCrossOrigin,
  respondEmpty,
  respondRedirect,
} from './http.ts'
import {
  buildClearedSessionCookies,
  buildSessionCookies,
  createSessionToken,
  getSessionExpiry,
  hashSessionToken,
  readCookies,
  serializeCookie,
} from './session.ts'

export interface AuthDependencies {
  repository: Repository
  google: GoogleConfig
  fetchToken?: typeof fetch
  now?: () => Date
}

const ATTEMPT_COOKIE = 'stamped_sign_in'
const ATTEMPT_PATH = '/api/auth'
const ATTEMPT_SECONDS = 10 * 60
const FAILED_REDIRECT = '/?signin=failed'

const clearAttemptCookie = () =>
  serializeCookie(ATTEMPT_COOKIE, '', { maxAgeSeconds: 0, path: ATTEMPT_PATH })

const serializeAttempt = ({ state, verifier }: SignInAttempt) =>
  serializeCookie(ATTEMPT_COOKIE, `${state}.${verifier}`, {
    maxAgeSeconds: ATTEMPT_SECONDS,
    path: ATTEMPT_PATH,
  })

const readAttempt = (request: Request) => {
  const [state, verifier] = (readCookies(request).get(ATTEMPT_COOKIE) ?? '').split('.')
  return state && verifier ? { state, verifier } : null
}

export const startGoogleSignIn = async (
  request: Request,
  { google }: Pick<AuthDependencies, 'google'>
): Promise<Response> => {
  const attempt = createSignInAttempt()
  const url = buildAuthUrl({ clientId: google.clientId, origin: getOrigin(request), attempt })
  return respondRedirect(url, [serializeAttempt(attempt)])
}

const readCallbackCode = (request: Request): { code: string; verifier: string } | null => {
  const params = new URL(request.url).searchParams
  const attempt = readAttempt(request)
  const code = params.get('code')
  if (!attempt || !code || params.get('state') !== attempt.state) return null
  return { code, verifier: attempt.verifier }
}

const createSessionFor = async (
  request: Request,
  deps: AuthDependencies,
  callback: { code: string; verifier: string }
) => {
  const { repository, google, fetchToken, now = () => new Date() } = deps
  const exchange = { config: google, origin: getOrigin(request), ...callback }
  const profile = await exchangeCode(exchange, fetchToken)
  const userId = await repository.upsertGoogleUser(profile)
  const token = createSessionToken()
  await repository.createSession({
    tokenHash: hashSessionToken(token),
    userId,
    expiresAt: getSessionExpiry(now()),
  })
  return token
}

export const finishGoogleSignIn = async (
  request: Request,
  deps: AuthDependencies
): Promise<Response> => {
  const callback = readCallbackCode(request)
  if (!callback) return respondRedirect(FAILED_REDIRECT, [clearAttemptCookie()])
  try {
    const token = await createSessionFor(request, deps, callback)
    return respondRedirect('/', [clearAttemptCookie(), ...buildSessionCookies(token)])
  } catch (error) {
    console.error('google sign-in failed', error)
    return respondRedirect(FAILED_REDIRECT, [clearAttemptCookie()])
  }
}

export const signOut = async (request: Request, repository: Repository): Promise<Response> => {
  if (!isSameOriginJson(request)) return respondCrossOrigin()
  const tokenHash = readSessionHash(request)
  if (tokenHash) await repository.deleteSession(tokenHash)
  return respondEmpty(buildClearedSessionCookies())
}
