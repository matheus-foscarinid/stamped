import type { CountryCode } from '@/countries'

export const STAMP_SHAPES = ['round', 'square', 'perforated'] as const
const INK_COUNT = 5
const MAX_TILT_DEG = 8

export interface StampStyle {
  shape: (typeof STAMP_SHAPES)[number]
  ink: number
  tiltDeg: number
}

// small string hash, so a country gets the same stamp on every device
const hashCode = (code: string): number =>
  [...code].reduce((hash, letter) => Math.imul(hash ^ letter.charCodeAt(0), 0x9e3779b1) >>> 0, 7)

export const getStampStyle = (code: CountryCode): StampStyle => {
  const hash = hashCode(code)
  return {
    shape: STAMP_SHAPES[hash % STAMP_SHAPES.length] ?? 'round',
    ink: (hash >>> 4) % INK_COUNT,
    tiltDeg: ((hash >>> 8) % (MAX_TILT_DEG * 2 + 1)) - MAX_TILT_DEG,
  }
}
