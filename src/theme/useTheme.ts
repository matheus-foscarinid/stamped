import { onScopeDispose, type Ref, ref } from 'vue'
import {
  applyTheme,
  DARK_SCHEME_QUERY,
  readStoredTheme,
  resolveTheme,
  storeTheme,
  type ThemeChoice,
} from './themes.ts'

interface UseThemeResult {
  theme: Ref<ThemeChoice>
  setTheme: (choice: ThemeChoice) => void
}

export const useTheme = (): UseThemeResult => {
  const theme = ref<ThemeChoice>(readStoredTheme())
  const darkScheme = window.matchMedia(DARK_SCHEME_QUERY)
  const applyChoice = () => applyTheme(resolveTheme(theme.value, darkScheme.matches))

  const setTheme = (choice: ThemeChoice) => {
    theme.value = choice
    storeTheme(choice)
    applyChoice()
  }

  // auto follows the system, even while the page is open
  darkScheme.addEventListener('change', applyChoice)
  onScopeDispose(() => darkScheme.removeEventListener('change', applyChoice))
  applyChoice()

  return { theme, setTheme }
}
