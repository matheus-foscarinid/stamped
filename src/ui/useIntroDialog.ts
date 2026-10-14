import { type Ref, ref } from 'vue'

const INTRO_STORAGE_KEY = 'stamped-intro-seen'

interface UseIntroDialogResult {
  isOpen: Ref<boolean>
  close: () => void
}

// blocked storage can't remember a close, so it skips the intro instead of showing it every visit
const hasSeenIntro = (): boolean => {
  try {
    return localStorage.getItem(INTRO_STORAGE_KEY) !== null
  } catch {
    return true
  }
}

const rememberIntroSeen = () => {
  try {
    localStorage.setItem(INTRO_STORAGE_KEY, '1')
  } catch {
    // nothing to remember it in
  }
}

export const useIntroDialog = (): UseIntroDialogResult => {
  const isOpen = ref(!hasSeenIntro())
  const close = () => {
    isOpen.value = false
    rememberIntroSeen()
  }
  return { isOpen, close }
}
