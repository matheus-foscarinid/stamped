import type { CountryCode } from './catalog.ts'

// land that another country claims, or that only some countries recognise
const DISPUTED_CODES: ReadonlySet<CountryCode> = new Set([
  'eh',
  'fk',
  'ps',
  'tw',
  'xa',
  'xk',
  'xn',
  'xo',
  'xs',
  'xt',
])

export const isDisputed = (code: CountryCode): boolean => DISPUTED_CODES.has(code)
