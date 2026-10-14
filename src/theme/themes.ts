import { buildLogoDataUrl } from '@/brand/logo'
import { readCssTokens } from '@/styles/css-tokens'

export const THEME_CHOICES = [
  'auto',
  'light',
  'dark',
  'lilac',
  'ink',
  'rose',
  'ocean',
  'sunset',
  'dusk',
  'forest',
  'midnight',
] as const

export type ThemeChoice = (typeof THEME_CHOICES)[number]

export type ThemeName = Exclude<ThemeChoice, 'auto'>

export const THEME_LABELS: Record<ThemeChoice, string> = {
  auto: 'Auto',
  light: 'Light',
  dark: 'Dark',
  lilac: 'Lilac',
  ink: 'Ink',
  rose: 'Rose',
  ocean: 'Ocean',
  sunset: 'Sunset',
  dusk: 'Dusk',
  forest: 'Forest',
  midnight: 'Midnight',
}

// index.html reads this key before first paint, so keep the two in step
const THEME_STORAGE_KEY = 'stamped-theme'

export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)'

const isThemeChoice = (value: unknown): value is ThemeChoice =>
  THEME_CHOICES.some(choice => choice === value)

export const resolveTheme = (choice: ThemeChoice, prefersDark: boolean): ThemeName => {
  if (choice !== 'auto') return choice
  return prefersDark ? 'dark' : 'light'
}

export const readStoredTheme = (): ThemeChoice => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeChoice(stored) ? stored : 'auto'
  } catch {
    return 'auto'
  }
}

export const storeTheme = (choice: ThemeChoice): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, choice)
  } catch {
    // blocked storage keeps the theme for this visit only
  }
}

// keep in step with the .logo-* colours in TravelSummary.vue
const BROWSER_CHROME_TOKENS = {
  pageColor: '--page-bg',
  logoFrame: '--text-muted',
  logoGlobe: '--map-visited',
}

export const applyTheme = (name: ThemeName): void => {
  const root = document.documentElement
  root.dataset.theme = name
  const { pageColor, logoFrame, logoGlobe } = readCssTokens(root, BROWSER_CHROME_TOKENS)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', pageColor)
  const favicon = buildLogoDataUrl({ frame: logoFrame, globe: logoGlobe })
  document.querySelector('link[rel="icon"]')?.setAttribute('href', favicon)
}
