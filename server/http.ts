import type { Repository } from './db.ts'
import {
  buildClearedSessionCookies,
  hashSessionToken,
  readCookies,
  SESSION_COOKIE,
} from './session.ts'
import { InvalidBodyError } from './validate.ts'

const withCookies = (headers: Headers, cookies: readonly string[]) => {
  for (const cookie of cookies) headers.append('set-cookie', cookie)
  return headers
}

export const respondJson = (body: unknown, status = 200, cookies: readonly string[] = []) =>
  new Response(JSON.stringify(body), {
    status,
    headers: withCookies(
      new Headers({ 'content-type': 'application/json', 'cache-control': 'no-store' }),
      cookies
    ),
  })

export const respondEmpty = (cookies: readonly string[] = []) =>
  new Response(null, { status: 204, headers: withCookies(new Headers(), cookies) })

export const respondRedirect = (location: string, cookies: readonly string[] = []) =>
  new Response(null, {
    status: 302,
    headers: withCookies(new Headers({ location, 'cache-control': 'no-store' }), cookies),
  })

// the signed-in hint goes too, so the page stops asking for an account that's gone
export const respondSignedOut = () =>
  respondJson({ error: 'signed out' }, 401, buildClearedSessionCookies())

export const respondCrossOrigin = () => respondJson({ error: 'cross-origin request' }, 403)

export const getOrigin = (request: Request): string => new URL(request.url).origin

// sameSite=lax already keeps other sites' forms out. this also stops a cross-site fetch
export const isSameOriginJson = (request: Request): boolean =>
  request.headers.get('origin') === getOrigin(request) &&
  (request.headers.get('content-type') ?? '').startsWith('application/json')

export const readSessionHash = (request: Request): Buffer | null => {
  const token = readCookies(request).get(SESSION_COOKIE)
  return token ? hashSessionToken(token) : null
}

const findUserId = async (request: Request, repository: Repository) => {
  const tokenHash = readSessionHash(request)
  return tokenHash ? repository.findSessionUserId(tokenHash) : null
}

export const readJson = async (request: Request): Promise<unknown> => {
  try {
    return await request.json()
  } catch {
    throw new InvalidBodyError('body is not json')
  }
}

type UserHandler = (userId: string) => Promise<Response>

const withUser = async (
  request: Request,
  repository: Repository,
  handler: UserHandler
): Promise<Response> => {
  const userId = await findUserId(request, repository)
  if (!userId) return respondSignedOut()
  try {
    return await handler(userId)
  } catch (error) {
    if (error instanceof InvalidBodyError) return respondJson({ error: error.message }, 400)
    throw error
  }
}

export const withMutatingUser = async (
  request: Request,
  repository: Repository,
  handler: UserHandler
): Promise<Response> => {
  if (!isSameOriginJson(request)) return respondCrossOrigin()
  return withUser(request, repository, handler)
}
