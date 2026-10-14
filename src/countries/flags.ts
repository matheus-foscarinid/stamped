import type { CountryCode } from './catalog.ts'

const REGIONAL_INDICATOR_A = 0x1f1e6
const LETTER_A = 'a'.charCodeAt(0)
const PLAIN_FLAG = '🏳️'

// iso keeps x codes for private use, so emoji sets have no flags for them and show boxes
const hasNoFlag = (code: CountryCode): boolean => code.startsWith('x')

// a flag emoji is just the two-letter code written in regional indicator symbols
export const getFlagEmoji = (code: CountryCode): string => {
  if (hasNoFlag(code)) return PLAIN_FLAG
  return String.fromCodePoint(
    ...[...code].map(letter => REGIONAL_INDICATOR_A + letter.charCodeAt(0) - LETTER_A)
  )
}
