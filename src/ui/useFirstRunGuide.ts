import { type ComputedRef, computed, type Ref, ref, watch } from 'vue'
import { hasSignedInHint, useAccount } from '@/account/account'

const GUIDE_STORAGE_KEY = 'stamped-guide-hidden'
const PASSPORT_STORAGE_KEY = 'stamped-passport-seen'

type GuideStepKey = 'stamp' | 'passport' | 'account'

interface GuideStep {
  key: GuideStepKey
  isDone: boolean
}

interface UseFirstRunGuideOptions {
  visitedCount: Ref<number>
  isPassportOpen: Ref<boolean>
}

interface UseFirstRunGuideResult {
  isShown: ComputedRef<boolean>
  steps: ComputedRef<GuideStep[]>
  doneCount: ComputedRef<number>
  hide: () => void
}

// blocked storage hides the guide rather than show it on every visit
const readFlag = (key: string): boolean => {
  try {
    return localStorage.getItem(key) !== null
  } catch {
    return true
  }
}

const writeFlag = (key: string) => {
  try {
    localStorage.setItem(key, '1')
  } catch {}
}

// a signed-in visit has nothing left to nudge towards, so it never sees the guide
const isGuideHidden = () => readFlag(GUIDE_STORAGE_KEY) || hasSignedInHint()

export const useFirstRunGuide = ({
  visitedCount,
  isPassportOpen,
}: UseFirstRunGuideOptions): UseFirstRunGuideResult => {
  const isHidden = ref(isGuideHidden())
  const hasSeenPassport = ref(readFlag(PASSPORT_STORAGE_KEY))
  const { user } = useAccount()

  watch(isPassportOpen, isOpen => {
    if (!isOpen || hasSeenPassport.value) return
    hasSeenPassport.value = true
    writeFlag(PASSPORT_STORAGE_KEY)
  })

  const steps = computed<GuideStep[]>(() => [
    { key: 'stamp', isDone: visitedCount.value > 0 },
    { key: 'passport', isDone: hasSeenPassport.value },
    { key: 'account', isDone: user.value !== null },
  ])
  const doneCount = computed(() => steps.value.filter(step => step.isDone).length)

  const hide = () => {
    isHidden.value = true
    writeFlag(GUIDE_STORAGE_KEY)
  }

  // the passport covers the stage, so the guide waits for it to close
  const isShown = computed(
    () => !isHidden.value && !isPassportOpen.value && doneCount.value < steps.value.length
  )

  return { isShown, steps, doneCount, hide }
}
