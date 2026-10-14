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

  const closeOnOutsidePress = (event: PointerEvent) => {
    if (event.target instanceof Node && root.value?.contains(event.target)) return
    isOpen.value = false
  }

  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close()
  }

  const stopListening = () => {
    document.removeEventListener('pointerdown', closeOnOutsidePress)
    document.removeEventListener('keydown', closeOnEscape)
  }

  watch(isOpen, isNowOpen => {
    if (!isNowOpen) return stopListening()
    document.addEventListener('pointerdown', closeOnOutsidePress)
    document.addEventListener('keydown', closeOnEscape)
  })
  onScopeDispose(stopListening)

  const toggle = () => {
    isOpen.value = !isOpen.value
  }

  return { isOpen, toggle, close }
}
