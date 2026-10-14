import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubLocaleFiles } from '@/test/browser-stubs'
import { EN_MESSAGES, formatMessage, loadMessages, type MessageKey } from './messages.ts'

const LOCALE_FILES = import.meta.glob<Record<string, unknown>>('/public/locales/*.json', {
  eager: true,
  import: 'default',
})

const PT_TITLE = {
  zero: '{count} países visitados',
  one: '{count} país visitado',
  other: '{count} países visitados',
}

const listPlaceholders = (message: unknown): string[] => {
  const names = [...JSON.stringify(message).matchAll(/\{(\w+)\}/g)].map(([, name]) => name ?? '')
  return [...new Set(names)].sort()
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('formatMessage', () => {
  it('fills the placeholders', () => {
    expect(formatMessage({}, 'summary.count', 'en', { count: 3, total: 249 })).toBe('3 of 249')
  })

  it.each([
    [0, '0 countries visited'],
    [1, '1 country visited'],
    [2, '2 countries visited'],
  ])('uses the singular only for one country in english (%i)', (count, text) => {
    expect(formatMessage({}, 'card.title', 'en', { count })).toBe(text)
  })

  it('follows each language plural rules, with zero as its own form when given', () => {
    expect(formatMessage({ 'card.title': PT_TITLE }, 'card.title', 'pt', { count: 0 })).toBe(
      '0 países visitados'
    )
    expect(formatMessage({ 'card.title': PT_TITLE }, 'card.title', 'pt', { count: 1 })).toBe(
      '1 país visitado'
    )
    const frTitle = { one: '{count} pays visité', other: '{count} pays visités' }
    expect(formatMessage({ 'card.title': frTitle }, 'card.title', 'fr', { count: 0 })).toBe(
      '0 pays visité'
    )
  })

  it('falls back to english for a key the language is missing', () => {
    expect(formatMessage({}, 'share.copyLink', 'pt')).toBe('Copy link')
  })
})

describe('loadMessages', () => {
  it('keeps the messages and drops anything else in the file', async () => {
    stubLocaleFiles({ pt: { 'share.copyLink': 'Copiar link', 'clear.text': { one: 'x' }, x: 1 } })
    expect(await loadMessages('pt')).toEqual({ 'share.copyLink': 'Copiar link' })
  })

  it('fails when the file is missing, so the caller can stay in english', async () => {
    stubLocaleFiles({})
    await expect(loadMessages('pt')).rejects.toThrow('404')
  })
})

describe('locale files', () => {
  const englishKeys = Object.keys(EN_MESSAGES).sort()

  it.each(Object.entries(LOCALE_FILES))('%s has every english key and no others', (_, file) => {
    expect(Object.keys(file).sort()).toEqual(englishKeys)
  })

  it.each(Object.entries(LOCALE_FILES))('%s keeps the english placeholders', (_, file) => {
    for (const key of englishKeys) {
      const englishMessage = EN_MESSAGES[key as MessageKey]
      expect(listPlaceholders(file[key]), key).toEqual(listPlaceholders(englishMessage))
    }
  })
})
