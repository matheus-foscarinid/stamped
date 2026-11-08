import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildAccount, stubSignedIn, stubThemePage } from '@/test/browser-stubs'
import { mountComposable } from '@/test/composables'
import { useTheme } from './useTheme.ts'

const SAVED_THEME = 'rose'
const FRIEND_LINK = '#v=br,jp&t=dracula'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('when the page opens', () => {
  it("shows the linked theme without saving it over the viewer's own", () => {
    const { root } = stubThemePage({ hash: FRIEND_LINK, savedTheme: SAVED_THEME })
    expect(mountComposable(useTheme).result.theme.value).toBe('dracula')
    expect(root.dataset.theme).toBe('dracula')
    expect(localStorage.getItem('stamped-theme')).toBe(SAVED_THEME)
  })

  it('falls back to the saved theme when the linked one does not exist', () => {
    stubThemePage({ hash: '#v=br&t=neon', savedTheme: SAVED_THEME })
    expect(mountComposable(useTheme).result.theme.value).toBe(SAVED_THEME)
  })

  it('puts the saved theme in the link, so a copied link carries it', () => {
    const { location } = stubThemePage({ hash: '#v=br', savedTheme: SAVED_THEME })
    mountComposable(useTheme)
    expect(location.hash).toBe('#v=br&t=rose')
  })
})

describe('after picking a theme', () => {
  it('saves the pick and swaps it into the link', () => {
    const { location } = stubThemePage({ hash: FRIEND_LINK })
    mountComposable(useTheme).result.setTheme('gruvbox')
    expect(location.hash).toBe('#v=br,jp&t=gruvbox')
    expect(localStorage.getItem('stamped-theme')).toBe('gruvbox')
  })

  it('takes the theme out of the link for auto, and paints the system scheme', () => {
    const { location, root } = stubThemePage({ hash: FRIEND_LINK })
    mountComposable(useTheme).result.setTheme('auto')
    expect(location.hash).toBe('#v=br,jp')
    expect(root.dataset.theme).toBe('dark')
  })
})

describe('after pasting a link', () => {
  it('switches to the pasted theme', () => {
    const { pasteLink, root } = stubThemePage({ savedTheme: SAVED_THEME })
    const { result } = mountComposable(useTheme)
    pasteLink('#v=jp&t=ocean')
    expect(result.theme.value).toBe('ocean')
    expect(root.dataset.theme).toBe('ocean')
  })

  it('keeps the current theme and puts it back in a link without one', () => {
    const { pasteLink, location } = stubThemePage({ savedTheme: SAVED_THEME })
    const { result } = mountComposable(useTheme)
    pasteLink('#v=jp')
    expect(result.theme.value).toBe(SAVED_THEME)
    expect(location.hash).toBe('#v=jp&t=rose')
  })

  it('stops following pasted links once unmounted', () => {
    const { pasteLink } = stubThemePage({ savedTheme: SAVED_THEME })
    const { result, unmount } = mountComposable(useTheme)
    unmount()
    pasteLink('#t=ocean')
    expect(result.theme.value).toBe(SAVED_THEME)
  })
})

describe('when the system scheme changes', () => {
  it('repaints auto to follow it', () => {
    const { root, switchSystemScheme } = stubThemePage({ prefersDark: false })
    mountComposable(useTheme)
    expect(root.dataset.theme).toBe('light')
    switchSystemScheme(true)
    expect(root.dataset.theme).toBe('dark')
  })

  it('leaves a picked theme alone', () => {
    const { root, switchSystemScheme } = stubThemePage({ savedTheme: SAVED_THEME })
    mountComposable(useTheme)
    switchSystemScheme(false)
    expect(root.dataset.theme).toBe(SAVED_THEME)
  })
})

describe('when the account has a theme', () => {
  const ACCOUNT_THEME = 'ocean'

  // the account lives in module state, so each test imports a fresh copy
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const mountSignedInTheme = async (accountTheme: 'ocean' | null = ACCOUNT_THEME) => {
    vi.resetModules()
    stubSignedIn(buildAccount({ preferences: { theme: accountTheme } }))
    const { useTheme: useFreshTheme } = await import('./useTheme.ts')
    const { loadAccount } = await import('@/account/account')
    const { result } = mountComposable(useFreshTheme)
    await loadAccount()
    return result
  }

  it('shows it and puts it in the link', async () => {
    const { location } = stubThemePage({ hash: '#v=br', savedTheme: SAVED_THEME })
    const { theme } = await mountSignedInTheme()
    expect(theme.value).toBe(ACCOUNT_THEME)
    expect(location.hash).toBe('#v=br&t=ocean')
  })

  it("keeps a friend's theme on screen and saves the account's for the next visit", async () => {
    const { location } = stubThemePage({ hash: FRIEND_LINK, savedTheme: SAVED_THEME })
    const { theme } = await mountSignedInTheme()
    expect(theme.value).toBe('dracula')
    expect(location.hash).toBe(FRIEND_LINK)
    expect(localStorage.getItem('stamped-theme')).toBe(ACCOUNT_THEME)
  })
  it('sends no theme when none was picked here', async () => {
    stubThemePage({ hash: '#v=br' })
    await mountSignedInTheme(null)
    await vi.runAllTimersAsync()
    expect(fetch).toHaveBeenCalledOnce()
  })
})
