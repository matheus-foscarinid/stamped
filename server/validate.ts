import type { AccountPreferences, PlaceLists, PreferencesBody } from '../src/account/contract.ts'
import { COUNTRY_CODES, type CountryCode } from '../src/countries/catalog.ts'
import { keepVisitWins } from '../src/countries/lists.ts'
import { isLanguage } from '../src/i18n/language-codes.ts'
import { isCoverId } from '../src/passport/cover-ids.ts'
import { isThemeChoice } from '../src/theme/theme-choices.ts'

// every country fits, with room for the territories added later
const MAX_COUNTRIES = 400

const COUNTRY_CODE_SET: ReadonlySet<string> = new Set(COUNTRY_CODES)

export class InvalidBodyError extends Error {}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const readCountryCodes = (value: unknown, field: string): CountryCode[] => {
  if (!Array.isArray(value) || value.length > MAX_COUNTRIES) {
    throw new InvalidBodyError(`${field} must be a list of up to ${MAX_COUNTRIES} codes`)
  }
  const unknownCode = value.find(code => typeof code !== 'string' || !COUNTRY_CODE_SET.has(code))
  if (unknownCode !== undefined) throw new InvalidBodyError(`${field} has an unknown country`)
  return [...new Set(value as CountryCode[])]
}

// only countries for now. states and cities arrive with their own catalogs
export const readPlacesBody = (body: unknown): PlaceLists<CountryCode> => {
  if (!isRecord(body) || body.kind !== 'country') throw new InvalidBodyError('kind must be country')
  const lists = keepVisitWins({
    visited: readCountryCodes(body.visited, 'visited'),
    wishlist: readCountryCodes(body.wishlist, 'wishlist'),
  })
  return { visited: [...lists.visited], wishlist: [...lists.wishlist] }
}

const PREFERENCE_CHECKS: Record<keyof AccountPreferences, (value: unknown) => boolean> = {
  theme: isThemeChoice,
  cover: isCoverId,
  language: isLanguage,
}

const PREFERENCE_KEYS = Object.keys(PREFERENCE_CHECKS) as (keyof AccountPreferences)[]

export const readPreferencesBody = (body: unknown): PreferencesBody => {
  if (!isRecord(body)) throw new InvalidBodyError('preferences must be an object')
  const unknownKey = Object.keys(body).find(key => !Object.hasOwn(PREFERENCE_CHECKS, key))
  if (unknownKey) throw new InvalidBodyError(`${unknownKey} is not a preference`)
  const invalidKey = PREFERENCE_KEYS.find(
    key => Object.hasOwn(body, key) && !PREFERENCE_CHECKS[key](body[key])
  )
  if (invalidKey) throw new InvalidBodyError(`${invalidKey} has an unknown value`)
  return body as PreferencesBody
}
