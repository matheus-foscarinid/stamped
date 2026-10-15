import { afterEach, describe, expect, it, vi } from 'vitest'
import { shallowRef } from 'vue'
import { stubKeyboard } from '@/test/browser-stubs'
import { mountComposable } from '@/test/composables'
import { useSlashToSearch } from './useSlashToSearch.ts'

const mountShortcut = () => {
  const keyboard = stubKeyboard()
  const input = { focus: vi.fn() }
  const { unmount } = mountComposable(() => {
    useSlashToSearch(shallowRef(input as unknown as HTMLInputElement))
    return {}
  })
  return { ...keyboard, focus: input.focus, unmount }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('pressing slash', () => {
  it('jumps to the search without typing the slash', () => {
    const { press, focus } = mountShortcut()
    expect(press('/').defaultPrevented).toBe(true)
    expect(focus).toHaveBeenCalledOnce()
  })

  it('types a slash as usual inside a text field', () => {
    const { press, focus, textField } = mountShortcut()
    expect(press('/', { target: textField }).defaultPrevented).toBe(false)
    expect(focus).not.toHaveBeenCalled()
  })

  it('leaves shortcuts held with ctrl to the browser', () => {
    const { press, focus } = mountShortcut()
    press('/', { ctrlKey: true })
    expect(focus).not.toHaveBeenCalled()
  })

  it('stops listening once the search goes away', () => {
    const { press, focus, unmount } = mountShortcut()
    unmount()
    press('/')
    expect(focus).not.toHaveBeenCalled()
  })
})
