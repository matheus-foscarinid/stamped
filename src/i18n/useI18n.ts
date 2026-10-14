import { type Ref, readonly, ref, shallowRef } from 'vue'
import {
  BUNDLED_LANGUAGE,
  type Language,
  readStartingLanguage,
  storeLanguage,
} from './languages.ts'
import {
  EN_MESSAGES,
  formatMessage,
  loadMessages,
  type MessageKey,
  type MessageParams,
  type Messages,
} from './messages.ts'

interface UseI18nResult {
  language: Readonly<Ref<Language>>
  t: (key: MessageKey, params?: MessageParams) => string
  setLanguage: (next: Language) => Promise<void>
}

// one language for the whole page, so every component reads the same state
const language = ref<Language>(BUNDLED_LANGUAGE)
const messages = shallowRef<Messages>(EN_MESSAGES)
const loadedMessages = new Map<Language, Messages>([[BUNDLED_LANGUAGE, EN_MESSAGES]])

const fetchMessages = async (next: Language): Promise<Messages> => {
  const cached = loadedMessages.get(next)
  if (cached) return cached
  const loaded = await loadMessages(next)
  loadedMessages.set(next, loaded)
  return loaded
}

const showLanguage = async (next: Language) => {
  messages.value = await fetchMessages(next)
  language.value = next
  document.documentElement.lang = next
}

// a failed download leaves the page in english instead of blank
export const loadStartingLanguage = (): Promise<void> =>
  showLanguage(readStartingLanguage()).catch(() => undefined)

const t = (key: MessageKey, params?: MessageParams): string =>
  formatMessage(messages.value, key, language.value, params)

// a failed download keeps the current language, and the menu stays on it
const setLanguage = async (next: Language) => {
  try {
    await showLanguage(next)
    storeLanguage(next)
  } catch {}
}

export const useI18n = (): UseI18nResult => ({ language: readonly(language), t, setLanguage })
