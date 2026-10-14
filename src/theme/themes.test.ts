import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubStorage } from '@/test/browser-stubs'
import { readStoredTheme, resolveTheme, storeTheme } from './themes.ts'

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
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new DOMException('blocked', 'SecurityError')
      },
    })
    expect(readStoredTheme()).toBe('auto')
  })
})
