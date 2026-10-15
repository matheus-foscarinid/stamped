import { onScopeDispose, type Ref, ref } from 'vue'
import { updateAddressBarHash } from '@/share/link'
import { readThemeFromHash, writeThemeToHash } from './theme-link.ts'
import {
  applyTheme,
  DARK_SCHEME_QUERY,
  readStoredTheme,
  resolveTheme,
  storeTheme,
  switchTheme,
  type ThemeChoice,
} from './themes.ts'

interface UseThemeResult {
  theme: Ref<ThemeChoice>
  setTheme: (choice: ThemeChoice) => void
}

// a linked theme is only shown, so opening a friend's map never changes your own pick
const readStartingTheme = (): ThemeChoice =>
  readThemeFromHash(window.location.hash) ?? readStoredTheme()

const writeThemeToAddressBar = (choice: ThemeChoice) =>
  updateAddressBarHash(hash => writeThemeToHash(hash, choice))

export const useTheme = (): UseThemeResult => {
  const theme = ref<ThemeChoice>(readStartingTheme())
  const darkScheme = window.matchMedia(DARK_SCHEME_QUERY)
  const resolveChoice = () => resolveTheme(theme.value, darkScheme.matches)
  const applyChoice = () => switchTheme(resolveChoice())

  const showTheme = (choice: ThemeChoice) => {
    theme.value = choice
    applyChoice()
  }

  const setTheme = (choice: ThemeChoice) => {
    showTheme(choice)
    storeTheme(choice)
    writeThemeToAddressBar(choice)
  }

  // a pasted link without a theme keeps the current one in the link
  const followPastedLink = () => {
    const linked = readThemeFromHash(window.location.hash)
    if (linked && linked !== theme.value) showTheme(linked)
    writeThemeToAddressBar(theme.value)
  }

  // auto follows the system, even while the page is open
  darkScheme.addEventListener('change', applyChoice)
  window.addEventListener('hashchange', followPastedLink)
  onScopeDispose(() => {
    darkScheme.removeEventListener('change', applyChoice)
    window.removeEventListener('hashchange', followPastedLink)
  })
  // the first paint already has the theme, so there's nothing to fade from
  applyTheme(resolveChoice())
  writeThemeToAddressBar(theme.value)

  return { theme, setTheme }
}
