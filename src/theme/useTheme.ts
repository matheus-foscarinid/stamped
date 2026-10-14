import { onScopeDispose, type Ref, ref } from 'vue'
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

export const useTheme = (): UseThemeResult => {
  const theme = ref<ThemeChoice>(readStoredTheme())
  const darkScheme = window.matchMedia(DARK_SCHEME_QUERY)
  const resolveChoice = () => resolveTheme(theme.value, darkScheme.matches)
  const applyChoice = () => switchTheme(resolveChoice())

  const setTheme = (choice: ThemeChoice) => {
    theme.value = choice
    storeTheme(choice)
    applyChoice()
  }

  // auto follows the system, even while the page is open
  darkScheme.addEventListener('change', applyChoice)
  onScopeDispose(() => darkScheme.removeEventListener('change', applyChoice))
  // the first paint already has the theme, so there's nothing to fade from
  applyTheme(resolveChoice())

  return { theme, setTheme }
}
