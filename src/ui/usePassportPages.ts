import { onScopeDispose, type Ref, ref, type ShallowRef, watch } from 'vue'

interface UsePassportPagesInput {
  track: Readonly<ShallowRef<HTMLElement | null>>
}

interface UsePassportPagesResult {
  spreadIndex: Ref<number>
  spreadCount: Ref<number>
  turnBy: (step: number) => void
}

const TURN_KEYS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 }
const OWN_ARROWS_SELECTOR = 'input, textarea, select, dialog, [role="menu"]'

// arrows in a field, a dialog or with a modifier (back, word jumps) aren't ours to take
const isOtherArrowUse = (event: KeyboardEvent) => {
  if (event.defaultPrevented || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
    return true
  }
  const { target } = event
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || target.closest(OWN_ARROWS_SELECTOR) !== null
}

// native scroll drives swipes, this only follows
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
    if (step === undefined || isOtherArrowUse(event)) return
    const nextIndex = spreadIndex.value + step
    if (nextIndex < 0 || nextIndex >= spreadCount.value) return
    event.preventDefault()
    turnBy(step)
  }

  watch(track, (element, _previous, onCleanup) => {
    if (!element) return
    element.addEventListener('scroll', measure, { passive: true })
    onCleanup(() => element.removeEventListener('scroll', measure))
    measure()
  })
  document.addEventListener('keydown', turnOnArrow)
  window.addEventListener('resize', measure)
  onScopeDispose(() => {
    document.removeEventListener('keydown', turnOnArrow)
    window.removeEventListener('resize', measure)
  })

  return { spreadIndex, spreadCount, turnBy }
}
