import { type CountryCode, getCountryHue, hashCountryCode } from '@/countries'

export const STAMP_SHAPES = ['round', 'hexagon', 'perforated', 'oval'] as const
const MAX_TILT_DEG = 8

export interface StampStyle {
  shape: (typeof STAMP_SHAPES)[number]
  hue: number
  tiltDeg: number
}

export const getStampStyle = (code: CountryCode): StampStyle => {
  const hash = hashCountryCode(code)
  return {
    shape: STAMP_SHAPES[(hash >>> 4) % STAMP_SHAPES.length] ?? 'round',
    hue: getCountryHue(code),
    tiltDeg: ((hash >>> 8) % (MAX_TILT_DEG * 2 + 1)) - MAX_TILT_DEG,
  }
}

const MAX_LABEL_SIZE = 9
// bold uppercase letters run about this wide, in ems
const LETTER_WIDTH_EM = 0.68

// rim and line labels shrink to fit, so long names stay on the stamp
export const fitLabelSize = (label: string, availableWidth: number): number =>
  Math.min(MAX_LABEL_SIZE, availableWidth / (Math.max(label.length, 1) * LETTER_WIDTH_EM))
