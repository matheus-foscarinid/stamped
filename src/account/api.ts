import type { AccountResponse, PlacesBody, PreferencesBody } from './contract.ts'

export const SIGN_IN_URL = '/api/auth/google'

export interface SendOptions {
  keepalive?: boolean
}

export class SignedOutError extends Error {}

// json tells it apart from a cross-site form
const send = async (
  url: string,
  method: string,
  body: object,
  { keepalive = false }: SendOptions = {}
) => {
  const response = await fetch(url, {
    method,
    keepalive,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (response.status === 401) throw new SignedOutError(`${method} ${url} found no session`)
  if (!response.ok) throw new Error(`${method} ${url} failed with ${response.status}`)
}

export const fetchAccount = async (): Promise<AccountResponse | null> => {
  const response = await fetch('/api/me')
  if (response.status === 401) return null
  if (!response.ok) throw new Error(`loading the account failed with ${response.status}`)
  return response.json()
}

export const savePlaces = (body: PlacesBody, options?: SendOptions) =>
  send('/api/me/places', 'PUT', body, options)

export const savePreferences = (body: PreferencesBody, options?: SendOptions) =>
  send('/api/me/preferences', 'PATCH', body, options)

export const postSignOut = () => send('/api/auth/logout', 'POST', {})

export const deleteAccount = () => send('/api/me', 'DELETE', {})
