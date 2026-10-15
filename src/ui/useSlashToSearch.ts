import { onScopeDispose, type ShallowRef } from 'vue'

const isTypingInto = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

// "/" jumps to the search like on most sites, unless it's typed into a field
export const useSlashToSearch = (input: Readonly<ShallowRef<HTMLInputElement | null>>): void => {
  const focusSearch = (event: KeyboardEvent) => {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
    if (isTypingInto(event.target)) return
    event.preventDefault()
    input.value?.focus()
  }
  document.addEventListener('keydown', focusSearch)
  onScopeDispose(() => document.removeEventListener('keydown', focusSearch))
}
