import type { CountryCode } from './catalog.ts'

const REGIONAL_INDICATOR_A = 0x1f1e6
const LETTER_A = 'a'.charCodeAt(0)
const PLAIN_FLAG = '🏳️'

// emoji sets have no flag for these, so the letters would show as boxes
const CODES_WITHOUT_FLAG: ReadonlySet<CountryCode> = new Set(['xa', 'xk', 'xn', 'xo', 'xs', 'xt'])

// a flag emoji is just the two-letter code written in regional indicator symbols
export const getFlagEmoji = (code: CountryCode): string => {
  if (CODES_WITHOUT_FLAG.has(code)) return PLAIN_FLAG
  return String.fromCodePoint(
    ...[...code].map(letter => REGIONAL_INDICATOR_A + letter.charCodeAt(0) - LETTER_A)
  )
}
