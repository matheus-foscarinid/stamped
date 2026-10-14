import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubBlockedStorage, stubStorage, stubThemeSwitch } from '@/test/browser-stubs'
import { readStoredTheme, resolveTheme, storeTheme, switchTheme } from './themes.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('resolveTheme', () => {
  it.each([
    [false, 'light'],
    [true, 'dark'],
  ] as const)('turns auto into the system scheme (dark: %s)', (prefersDark, theme) => {
    expect(resolveTheme('auto', prefersDark)).toBe(theme)
  })

  it('keeps a picked palette whatever the system says', () => {
    expect(resolveTheme('rose', true)).toBe('rose')
  })
})

describe('readStoredTheme', () => {
  it('returns the theme picked on an earlier visit', () => {
    stubStorage()
    storeTheme('dusk')
    expect(readStoredTheme()).toBe('dusk')
  })

  it('falls back to auto for a theme that no longer exists', () => {
    stubStorage({ 'stamped-theme': 'neon' })
    expect(readStoredTheme()).toBe('auto')
  })

  it('falls back to auto when storage is blocked', () => {
    stubBlockedStorage()
    expect(readStoredTheme()).toBe('auto')
  })
})

describe('storeTheme', () => {
  it('keeps the page working when storage is blocked', () => {
    stubBlockedStorage()
    expect(() => storeTheme('dusk')).not.toThrow()
  })
})

describe('switchTheme', () => {
  it('fades into the new theme through a view transition', () => {
    const { startViewTransition, root } = stubThemeSwitch({ prefersReducedMotion: false })
    switchTheme('dusk')
    expect(startViewTransition).toHaveBeenCalledOnce()
    expect(root.dataset.theme).toBe('dusk')
  })

  it('switches at once when the visitor asks for less motion', () => {
    const { startViewTransition, root } = stubThemeSwitch({ prefersReducedMotion: true })
    switchTheme('forest')
    expect(startViewTransition).not.toHaveBeenCalled()
    expect(root.dataset.theme).toBe('forest')
  })

  it('switches at once in browsers without view transitions', () => {
    const { root } = stubThemeSwitch({ prefersReducedMotion: false, hasViewTransitions: false })
    switchTheme('ink')
    expect(root.dataset.theme).toBe('ink')
  })
})
