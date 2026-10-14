import { describe, expect, it } from 'vitest'
import { LANGUAGES } from '@/i18n/languages'
import { COUNTRY_CODES } from './catalog.ts'
import { isDisputed } from './disputed.ts'
import { getCountryName } from './names.ts'

// iso keeps x codes for private use, the browser can't name them
const PRIVATE_CODES = COUNTRY_CODES.filter(code => code.startsWith('x'))

describe('our private-use codes', () => {
  it.each(PRIVATE_CODES)('has a name for %s in every language, not the raw code', code => {
    for (const language of LANGUAGES) {
      const name = getCountryName(code, language)
      expect(name).not.toBe('')
      expect(name.toLowerCase()).not.toBe(code)
      expect(name).not.toMatch(/pseudo/i)
    }
  })

  it.each(PRIVATE_CODES)('tags %s as disputed', code => {
    expect(isDisputed(code)).toBe(true)
  })
})
