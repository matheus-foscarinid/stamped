import type { CountryCode } from './catalog.ts'

const HUE_COUNT = 360

// small string hash, so a country looks the same on every device
export const hashCountryCode = (code: CountryCode): number =>
  [...code].reduce((hash, letter) => Math.imul(hash ^ letter.charCodeAt(0), 0x9e3779b1) >>> 0, 7)

// themes pick the saturation and lightness, so the hue stays readable on any background
export const getCountryHue = (code: CountryCode): number => hashCountryCode(code) % HUE_COUNT
