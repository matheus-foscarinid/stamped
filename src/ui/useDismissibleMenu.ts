import { onScopeDispose, type Ref, ref, type ShallowRef, watch } from 'vue'

interface UseDismissibleMenuInput {
  root: Readonly<ShallowRef<HTMLElement | null>>
  trigger: Readonly<ShallowRef<HTMLButtonElement | null>>
}

interface UseDismissibleMenuResult {
  isOpen: Ref<boolean>
  toggle: () => void
  close: () => void
}

export const useDismissibleMenu = ({
  root,
  trigger,
}: UseDismissibleMenuInput): UseDismissibleMenuResult => {
  const isOpen = ref(false)

  // back to the trigger, so keyboard users don't lose their place
  const close = () => {
    isOpen.value = false
    trigger.value?.focus()
  }

  // the press only closes the menu, so a tap on the map doesn't also stamp a country
  const closeOnOutsidePress = (event: PointerEvent) => {
    if (event.target instanceof Node && root.value?.contains(event.target)) return
    event.stopPropagation()
    isOpen.value = false
  }

  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close()
  }

  const stopListening = () => {
    document.removeEventListener('pointerdown', closeOnOutsidePress, { capture: true })
    document.removeEventListener('keydown', closeOnEscape)
  }

  watch(isOpen, isNowOpen => {
    if (!isNowOpen) return stopListening()
    document.addEventListener('pointerdown', closeOnOutsidePress, { capture: true })
    document.addEventListener('keydown', closeOnEscape)
  })
  onScopeDispose(stopListening)

  const toggle = () => {
    isOpen.value = !isOpen.value
  }

  return { isOpen, toggle, close }
}
