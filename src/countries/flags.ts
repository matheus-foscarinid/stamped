import type { CountryCode } from './catalog.ts'

const REGIONAL_INDICATOR_A = 0x1f1e6
const LETTER_A = 'a'.charCodeAt(0)

// a flag emoji is just the two-letter code written in regional indicator symbols
export const getFlagEmoji = (code: CountryCode): string =>
  String.fromCodePoint(
    ...[...code].map(letter => REGIONAL_INDICATOR_A + letter.charCodeAt(0) - LETTER_A)
  )
