import { type CountryCode, getCountryHue, hashCountryCode } from '@/countries'

export const STAMP_SHAPES = ['round', 'hexagon', 'perforated', 'oval'] as const
const MAX_TILT_DEG = 8

export type StampShape = (typeof STAMP_SHAPES)[number]

export interface StampStyle {
  shape: StampShape
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

const MAX_LABEL_SIZE = 7.5
// bold uppercase letters plus the label's letter spacing run about this wide, in ems
const LETTER_WIDTH_EM = 0.76

// shrink long names to fit
export const fitLabelSize = (label: string, availableWidth: number): number =>
  Math.min(MAX_LABEL_SIZE, availableWidth / (Math.max(label.length, 1) * LETTER_WIDTH_EM))
