import { type ComputedRef, computed, type Ref, readonly, ref, shallowRef } from 'vue'
import { type CountryLists, isSameLists } from '@/countries'
import {
  deleteAccount,
  fetchAccount,
  postSignOut,
  type SendOptions,
  SignedOutError,
  savePlaces,
  savePreferences,
} from './api.ts'
import {
  type AccountPreferences,
  type AccountResponse,
  type AccountUser,
  type PlacesBody,
  type PreferencesBody,
  SIGNED_IN_COOKIE,
} from './contract.ts'
import { createSaveQueue } from './save-queue.ts'

export { SIGN_IN_URL } from './api.ts'

export type AccountProblem = 'signInFailed' | 'syncFailed'

type AccountListener = (account: AccountResponse) => void
type EditedSlice = 'places' | keyof AccountPreferences

const FAILED_SIGN_IN_PARAM = 'signin'
const PLACES_DEBOUNCE_MS = 800
const PREFERENCES_DEBOUNCE_MS = 300
const REFRESH_AFTER_MS = 60_000

const account = shallowRef<AccountResponse | null>(null)
const problem = ref<AccountProblem | null>(null)
const listeners = new Set<AccountListener>()
// an edit made while the account loads wins over the saved copy
const editedBeforeLoad = new Set<EditedSlice>()
let loadedAt = 0

export const hasSignedInHint = (): boolean =>
  document.cookie.split('; ').includes(`${SIGNED_IN_COOKIE}=1`)

const places = createSaveQueue<PlacesBody>({
  send: savePlaces,
  merge: (_older, newer) => newer,
  delayMs: PLACES_DEBOUNCE_MS,
  onFailure: error => reportSyncFailure(error),
})

const preferences = createSaveQueue<PreferencesBody>({
  send: savePreferences,
  merge: (older, newer) => ({ ...older, ...newer }),
  delayMs: PREFERENCES_DEBOUNCE_MS,
  onFailure: error => reportSyncFailure(error),
})

const endSession = () => {
  places.discard()
  preferences.discard()
  account.value = null
}

const reportSyncFailure = (error?: unknown) => {
  if (error instanceof SignedOutError) endSession()
  else problem.value = 'syncFailed'
}

const flushEdits = async (options?: SendOptions) => {
  await Promise.all([places.flush(options), preferences.flush(options)])
}

const isSyncIdle = () => places.isIdle() && preferences.isIdle()

// dropped from the address bar so a reload doesn't show it again
const takeFailedSignIn = (): boolean => {
  const { pathname, search, hash } = window.location
  const params = new URLSearchParams(search)
  if (params.get(FAILED_SIGN_IN_PARAM) !== 'failed') return false
  params.delete(FAILED_SIGN_IN_PARAM)
  const query = params.size > 0 ? `?${params}` : ''
  history.replaceState(null, '', `${pathname}${query}${hash}`)
  return true
}

const welcomeAccount = (loaded: AccountResponse) => {
  account.value = loaded
  loadedAt = Date.now()
  for (const listener of listeners) listener(loaded)
  editedBeforeLoad.clear()
}

const fetchAndWelcome = async (isPageReady: Promise<unknown>) => {
  try {
    const loaded = await fetchAccount()
    await isPageReady
    if (!loaded) endSession()
    else if (isSyncIdle()) welcomeAccount(loaded)
  } catch {
    reportSyncFailure()
  }
}

const refreshAccount = () => {
  const isFresh = Date.now() - loadedAt < REFRESH_AFTER_MS
  if (!account.value || isFresh || !isSyncIdle()) return
  void fetchAndWelcome(Promise.resolve())
}

// a phone can close a hidden tab without a pagehide
const followVisibility = () => {
  if (document.visibilityState === 'hidden') void flushEdits({ keepalive: true })
  else refreshAccount()
}

const flushBeforeLeaving = () => {
  void flushEdits({ keepalive: true })
}

// never throws, so the map keeps working when the api is down
export const loadAccount = async (isPageReady: Promise<unknown> = Promise.resolve()) => {
  if (takeFailedSignIn()) problem.value = 'signInFailed'
  if (!hasSignedInHint()) return
  window.addEventListener('pagehide', flushBeforeLeaving)
  document.addEventListener('visibilitychange', followVisibility)
  await fetchAndWelcome(isPageReady)
}

// a slice that mounts late still catches up
export const onAccountLoaded = (listener: AccountListener): (() => void) => {
  listeners.add(listener)
  if (account.value) listener(account.value)
  return () => listeners.delete(listener)
}

export const syncCountryLists = (lists: CountryLists): void => {
  const current = account.value
  if (!current) {
    editedBeforeLoad.add('places')
    return
  }
  if (isSameLists(current.places.country, lists)) return
  const country = { visited: [...lists.visited], wishlist: [...lists.wishlist] }
  account.value = { ...current, places: { ...current.places, country } }
  places.push({ kind: 'country', ...country })
}

export const syncPreference = <Key extends keyof AccountPreferences>(
  key: Key,
  value: NonNullable<AccountPreferences[Key]>
): void => {
  const current = account.value
  if (!current) {
    editedBeforeLoad.add(key)
    return
  }
  if (current.preferences[key] === value) return
  account.value = { ...current, preferences: { ...current.preferences, [key]: value } }
  preferences.push({ [key]: value })
}

interface ListsBinding {
  read: () => CountryLists
  show: (lists: CountryLists) => void
  isFriendsLink: boolean
}

// a friend's map stays on screen. the account's own map shows on the next visit
export const bindAccountLists = ({ read, show, isFriendsLink }: ListsBinding) =>
  onAccountLoaded(loaded => {
    const isEdited = editedBeforeLoad.has('places')
    if (isFriendsLink && !isEdited) return
    if (isEdited || !loaded.hasSavedData) syncCountryLists(read())
    else show(loaded.places.country)
  })

interface PreferenceBinding<Value> {
  // null until someone picks one, so a default never overwrites a real pick
  readStored: () => Value | null
  show: (value: Value) => void
}

export const bindAccountPreference = <Key extends keyof AccountPreferences>(
  key: Key,
  { readStored, show }: PreferenceBinding<NonNullable<AccountPreferences[Key]>>
) =>
  onAccountLoaded(loaded => {
    const saved = loaded.preferences[key]
    const stored = readStored()
    if (stored !== null && (saved === null || editedBeforeLoad.has(key))) {
      syncPreference(key, stored)
    } else if (saved !== null) {
      show(saved)
    }
  })

interface UseAccountResult {
  user: ComputedRef<AccountUser | null>
  problem: Readonly<Ref<AccountProblem | null>>
  signOut: () => Promise<void>
  removeAccount: () => Promise<void>
}

const leaveAccount = async (action: () => Promise<void>) => {
  try {
    await action()
    account.value = null
  } catch (error) {
    reportSyncFailure(error)
  }
}

const user = computed(() => account.value?.user ?? null)

export const useAccount = (): UseAccountResult => ({
  user,
  problem: readonly(problem),
  signOut: () => flushEdits().then(() => leaveAccount(postSignOut)),
  // a save already on its way can't land after the delete
  removeAccount: () => {
    places.discard()
    preferences.discard()
    return flushEdits().then(() => leaveAccount(deleteAccount))
  },
})
