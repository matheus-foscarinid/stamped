// no imports, the server uses it too
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
  'gruvbox',
  'dracula',
] as const

export type ThemeChoice = (typeof THEME_CHOICES)[number]

export type ThemeName = Exclude<ThemeChoice, 'auto'>

export const isThemeChoice = (value: unknown): value is ThemeChoice =>
  THEME_CHOICES.some(choice => choice === value)
