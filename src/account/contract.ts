// server/ imports this, so no browser code and relative .ts imports
import type { CountryCode } from '../countries/catalog.ts'
import type { Language } from '../i18n/language-codes.ts'
import type { CoverId } from '../passport/cover-ids.ts'
import type { ThemeChoice } from '../theme/theme-choices.ts'

// readable by the page, so a signed-out visit never makes an account request
export const SIGNED_IN_COOKIE = 'stamped_signed_in'

export interface PlaceLists<Code extends string = string> {
  visited: Code[]
  wishlist: Code[]
}

export interface AccountUser {
  email: string
  name: string | null
  avatarUrl: string | null
}

export interface AccountPreferences {
  theme: ThemeChoice | null
  cover: CoverId | null
  language: Language | null
}

export interface AccountResponse {
  user: AccountUser
  preferences: AccountPreferences
  places: { country: PlaceLists<CountryCode> }
  // false for a new account, which takes the browser's map instead of wiping it
  hasSavedData: boolean
}

export interface PlacesBody {
  kind: 'country'
  visited: string[]
  wishlist: string[]
}

export type PreferencesBody = Partial<AccountPreferences>
