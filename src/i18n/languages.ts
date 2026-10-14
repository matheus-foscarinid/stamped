// sorted by their own names, the way the menu lists them
export const LANGUAGES = ['de', 'en', 'es', 'fr', 'it', 'pt'] as const

export type Language = (typeof LANGUAGES)[number]

export const BUNDLED_LANGUAGE: Language = 'en'

const LANGUAGE_STORAGE_KEY = 'stamped-language'

const isLanguage = (value: unknown): value is Language =>
  LANGUAGES.some(language => language === value)

// "pt-BR" and "pt" both pick portuguese
export const matchLanguage = (preferred: readonly string[]): Language => {
  const bases = preferred.map(tag => tag.split('-')[0]?.toLowerCase())
  return bases.find(isLanguage) ?? BUNDLED_LANGUAGE
}

const readStoredLanguage = (): Language | null => {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return isLanguage(stored) ? stored : null
  } catch {
    return null
  }
}

export const readStartingLanguage = (): Language =>
  readStoredLanguage() ?? matchLanguage(navigator.languages)

export const storeLanguage = (language: Language): void => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // blocked storage keeps the language for this visit only
  }
}

export const getLanguageName = (language: Language): string => {
  const name = new Intl.DisplayNames([language], { type: 'language' }).of(language) ?? language
  return name.charAt(0).toLocaleUpperCase(language) + name.slice(1)
}
