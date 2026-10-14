import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubBlockedStorage, stubBrowserLanguages, stubStorage } from '@/test/browser-stubs'
import { getLanguageName, matchLanguage, readStartingLanguage } from './languages.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('matchLanguage', () => {
  it('picks the first supported language, ignoring the region', () => {
    expect(matchLanguage(['ja-JP', 'pt-BR', 'en-US'])).toBe('pt')
  })

  it('falls back to english when nothing is supported', () => {
    expect(matchLanguage(['ja', 'ko'])).toBe('en')
    expect(matchLanguage([])).toBe('en')
  })
})

describe('readStartingLanguage', () => {
  it('prefers the saved choice over the browser language', () => {
    stubStorage({ 'stamped-language': 'fr' })
    stubBrowserLanguages(['de-DE'])
    expect(readStartingLanguage()).toBe('fr')
  })

  it('follows the browser when nothing usable is saved', () => {
    stubStorage({ 'stamped-language': 'klingon' })
    stubBrowserLanguages(['es-MX'])
    expect(readStartingLanguage()).toBe('es')
  })

  it('follows the browser when storage is blocked', () => {
    stubBlockedStorage()
    stubBrowserLanguages(['it'])
    expect(readStartingLanguage()).toBe('it')
  })
})

describe('getLanguageName', () => {
  it('names each language in itself, capitalised', () => {
    expect(getLanguageName('pt')).toBe('Português')
    expect(getLanguageName('de')).toBe('Deutsch')
  })
})
