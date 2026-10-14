import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  stubBrowserLanguages,
  stubLocaleFiles,
  stubPageLanguage,
  stubStorage,
} from '@/test/browser-stubs'

const PT_FILE = { 'share.copyLink': 'Copiar link' }

// the language is page-wide state, so each test starts from a fresh module
const importI18n = async () => {
  vi.resetModules()
  const i18n = await import('./useI18n.ts')
  return { ...i18n, ...stubPageLanguage() }
}

beforeEach(() => {
  stubBrowserLanguages(['pt-BR'])
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('on page load', () => {
  it('shows the browser language and tags the page with it', async () => {
    stubStorage()
    stubLocaleFiles({ pt: PT_FILE })
    const { loadStartingLanguage, useI18n, documentElement } = await importI18n()
    await loadStartingLanguage()
    const { language, t } = useI18n()
    expect(language.value).toBe('pt')
    expect(t('share.copyLink')).toBe('Copiar link')
    expect(documentElement.lang).toBe('pt')
  })

  it('stays in english when the locale file fails', async () => {
    stubStorage()
    stubLocaleFiles({})
    const { loadStartingLanguage, useI18n } = await importI18n()
    await loadStartingLanguage()
    const { language, t } = useI18n()
    expect(language.value).toBe('en')
    expect(t('share.copyLink')).toBe('Copy link')
  })
})

describe('after picking a language', () => {
  it('switches and remembers the choice', async () => {
    const { values } = stubStorage()
    stubLocaleFiles({ pt: PT_FILE })
    const { useI18n } = await importI18n()
    const { language, setLanguage } = useI18n()
    await setLanguage('pt')
    expect(language.value).toBe('pt')
    expect(values.get('stamped-language')).toBe('pt')
  })

  it('keeps the current language and remembers nothing when the download fails', async () => {
    const { values } = stubStorage()
    stubLocaleFiles({})
    const { useI18n } = await importI18n()
    const { language, setLanguage } = useI18n()
    await setLanguage('fr')
    expect(language.value).toBe('en')
    expect(values.has('stamped-language')).toBe(false)
  })
})
