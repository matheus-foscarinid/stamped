import { type Ref, ref } from 'vue'
import { hasSavedMap } from '@/useCountryLists'

const INTRO_STORAGE_KEY = 'stamped-intro-seen'

interface UseIntroDialogResult {
  isOpen: Ref<boolean>
  close: () => void
}

// a saved map means they used the app before the intro existed.
// blocked storage skips it rather than show it on every visit
const hasSeenIntro = (): boolean => {
  try {
    return localStorage.getItem(INTRO_STORAGE_KEY) !== null || hasSavedMap()
  } catch {
    return true
  }
}

const rememberIntroSeen = () => {
  try {
    localStorage.setItem(INTRO_STORAGE_KEY, '1')
  } catch {}
}

export const useIntroDialog = (): UseIntroDialogResult => {
  const isOpen = ref(!hasSeenIntro())
  const close = () => {
    isOpen.value = false
    rememberIntroSeen()
  }
  return { isOpen, close }
}
