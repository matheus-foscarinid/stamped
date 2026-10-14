import EN_MESSAGES from './en.json'
import type { Language } from './languages.ts'

export type MessageKey = keyof typeof EN_MESSAGES

interface PluralMessage {
  zero?: string
  one?: string
  other: string
}

type Message = string | PluralMessage

export type Messages = Partial<Record<MessageKey, Message>>

export type MessageParams = Record<string, string | number>

// a slow locale file shouldn't hold the page back for long
const LOAD_TIMEOUT_MS = 3000

const isPluralMessage = (value: unknown): value is PluralMessage =>
  typeof value === 'object' && value !== null && typeof Reflect.get(value, 'other') === 'string'

const isMessage = (value: unknown): value is Message =>
  typeof value === 'string' || isPluralMessage(value)

const pickPluralForm = (message: PluralMessage, count: number, language: Language): string => {
  if (count === 0 && message.zero) return message.zero
  const form = new Intl.PluralRules(language).select(count)
  return (form === 'one' && message.one) || message.other
}

const fillParams = (text: string, params: MessageParams): string =>
  text.replace(/\{(\w+)\}/g, (placeholder, name: string) => String(params[name] ?? placeholder))

export const formatMessage = (
  messages: Messages,
  key: MessageKey,
  language: Language,
  params: MessageParams = {}
): string => {
  const message = messages[key] ?? EN_MESSAGES[key]
  if (typeof message === 'string') return fillParams(message, params)
  return fillParams(pickPluralForm(message, Number(params.count ?? 0), language), params)
}

// the file comes over the network, so anything that isn't a message falls back to english
const keepValidMessages = (data: unknown): Messages => {
  if (typeof data !== 'object' || data === null) return {}
  return Object.fromEntries(Object.entries(data).filter(([, value]) => isMessage(value)))
}

export const loadMessages = async (language: Language): Promise<Messages> => {
  const response = await fetch(`/locales/${language}.json`, {
    signal: AbortSignal.timeout(LOAD_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`locale ${language} failed with ${response.status}`)
  return keepValidMessages(await response.json())
}

export { EN_MESSAGES }
