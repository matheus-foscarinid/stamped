import { readStorage, writeStorage } from '@/storage'
import { BUNDLED_LANGUAGE, isLanguage, type Language } from './language-codes.ts'

export { BUNDLED_LANGUAGE, LANGUAGES, type Language } from './language-codes.ts'

const LANGUAGE_STORAGE_KEY = 'stamped-language'

// "pt-BR" and "pt" both pick portuguese
export const matchLanguage = (preferred: readonly string[]): Language => {
  const bases = preferred.map(tag => tag.split('-')[0]?.toLowerCase())
  return bases.find(isLanguage) ?? BUNDLED_LANGUAGE
}

export const readStoredLanguage = (): Language | null => {
  const stored = readStorage(LANGUAGE_STORAGE_KEY)
  return isLanguage(stored) ? stored : null
}

export const readStartingLanguage = (): Language =>
  readStoredLanguage() ?? matchLanguage(navigator.languages)

export const storeLanguage = (language: Language): void =>
  writeStorage(LANGUAGE_STORAGE_KEY, language)

export const getLanguageName = (language: Language): string => {
  const name = new Intl.DisplayNames([language], { type: 'language' }).of(language) ?? language
  return name.charAt(0).toLocaleUpperCase(language) + name.slice(1)
}
