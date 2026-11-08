import { createHash, randomBytes } from 'node:crypto'
import { SIGNED_IN_COOKIE } from '../src/account/contract.ts'

export const SESSION_COOKIE = 'stamped_session'
const SESSION_SECONDS = 30 * 24 * 60 * 60

export const createSessionToken = (): string => randomBytes(32).toString('base64url')

// a leaked sessions table can't be replayed as cookies
export const hashSessionToken = (token: string): Buffer =>
  createHash('sha256').update(token).digest()

export const getSessionExpiry = (now: Date): Date =>
  new Date(now.getTime() + SESSION_SECONDS * 1000)

const parseCookie = (part: string): [string, string][] => {
  const separator = part.indexOf('=')
  if (separator === -1) return []
  try {
    return [[part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim())]]
  } catch {
    return []
  }
}

export const readCookies = (request: Request): Map<string, string> =>
  new Map((request.headers.get('cookie') ?? '').split(';').flatMap(parseCookie))

interface CookieOptions {
  maxAgeSeconds: number
  isReadableByPage?: boolean
  path?: string
}

export const serializeCookie = (name: string, value: string, options: CookieOptions): string => {
  const { maxAgeSeconds, isReadableByPage = false, path = '/' } = options
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`, `Max-Age=${maxAgeSeconds}`]
  parts.push('Secure', 'SameSite=Lax')
  if (!isReadableByPage) parts.push('HttpOnly')
  return parts.join('; ')
}

export const buildSessionCookies = (token: string): string[] => {
  return [
    serializeCookie(SESSION_COOKIE, token, { maxAgeSeconds: SESSION_SECONDS }),
    serializeCookie(SIGNED_IN_COOKIE, '1', {
      maxAgeSeconds: SESSION_SECONDS,
      isReadableByPage: true,
    }),
  ]
}

export const buildClearedSessionCookies = (): string[] => [
  serializeCookie(SESSION_COOKIE, '', { maxAgeSeconds: 0 }),
  serializeCookie(SIGNED_IN_COOKIE, '', { maxAgeSeconds: 0, isReadableByPage: true }),
]
