// no imports, the server uses it too
// sorted by their own names, the way the menu lists them
export const LANGUAGES = ['de', 'en', 'es', 'fr', 'it', 'pt'] as const

export type Language = (typeof LANGUAGES)[number]

export const BUNDLED_LANGUAGE: Language = 'en'

export const isLanguage = (value: unknown): value is Language =>
  LANGUAGES.some(language => language === value)
