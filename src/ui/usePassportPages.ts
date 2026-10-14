import { onScopeDispose, type Ref, ref, type ShallowRef, watch } from 'vue'

interface UsePassportPagesInput {
  track: Readonly<ShallowRef<HTMLElement | null>>
}

interface UsePassportPagesResult {
  spreadIndex: Ref<number>
  spreadCount: Ref<number>
  turnBy: (step: number) => void
  measure: () => void
}

const TURN_KEYS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 }

// arrows in a text field move the caret, not the page
const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea'))

// the track scrolls natively, so phones swipe page by page and this only follows along
export const usePassportPages = ({ track }: UsePassportPagesInput): UsePassportPagesResult => {
  const spreadIndex = ref(0)
  const spreadCount = ref(1)

  const measure = () => {
    const element = track.value
    if (!element || element.clientWidth === 0) return
    spreadCount.value = Math.max(1, Math.round(element.scrollWidth / element.clientWidth))
    spreadIndex.value = Math.round(element.scrollLeft / element.clientWidth)
  }

  const turnBy = (step: number) => {
    const element = track.value
    if (element) element.scrollBy({ left: step * element.clientWidth })
  }

  const turnOnArrow = (event: KeyboardEvent) => {
    const step = TURN_KEYS[event.key]
    if (step === undefined || isTypingTarget(event.target)) return
    event.preventDefault()
    turnBy(step)
  }

  watch(track, (element, previous) => {
    previous?.removeEventListener('scroll', measure)
    element?.addEventListener('scroll', measure, { passive: true })
    measure()
  })
  document.addEventListener('keydown', turnOnArrow)
  onScopeDispose(() => {
    track.value?.removeEventListener('scroll', measure)
    document.removeEventListener('keydown', turnOnArrow)
  })

  return { spreadIndex, spreadCount, turnBy, measure }
}
