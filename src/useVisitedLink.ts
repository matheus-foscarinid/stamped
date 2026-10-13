import { onScopeDispose, type Ref, ref, watch } from 'vue'
import type { CountryCode } from '@/countries'
import { readVisitedFromHash, writeVisitedToHash } from '@/share/link'

export const useVisitedLink = (): Ref<readonly CountryCode[]> => {
  const visited = ref<readonly CountryCode[]>(readVisitedFromHash(window.location.hash))

  watch(visited, codes => {
    const { pathname, search } = window.location
    // replace, not push, so toggles don't flood the back button
    history.replaceState(null, '', `${pathname}${search}${writeVisitedToHash(codes)}`)
  })

  const followPastedLink = () => {
    visited.value = readVisitedFromHash(window.location.hash)
  }
  window.addEventListener('hashchange', followPastedLink)
  onScopeDispose(() => window.removeEventListener('hashchange', followPastedLink))

  return visited
}
