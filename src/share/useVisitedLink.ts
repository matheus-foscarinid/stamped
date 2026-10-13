import { onScopeDispose, type Ref, watch } from 'vue'
import type { CountryCode } from '@/countries'
import { readVisitedFromHash, writeVisitedToHash } from './link.ts'

export const readVisitedFromLocation = (): CountryCode[] =>
  readVisitedFromHash(window.location.hash)

// keeps the address bar and the visited list in step, so the url is always the latest map
export const useVisitedLink = (visited: Ref<readonly CountryCode[]>): void => {
  watch(visited, codes => {
    const { pathname, search } = window.location
    // replace, not push: one history entry per toggle would make the back button useless
    history.replaceState(null, '', `${pathname}${search}${writeVisitedToHash(codes)}`)
  })

  const followPastedLink = () => {
    visited.value = readVisitedFromLocation()
  }
  window.addEventListener('hashchange', followPastedLink)
  onScopeDispose(() => window.removeEventListener('hashchange', followPastedLink))
}
