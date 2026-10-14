import type { CountryCode } from './catalog.ts'

const HUE_COUNT = 360

// murmur3's final mix, so codes that share a letter (fr, de) still land far apart
const mixBits = (value: number): number => {
  let mixed = value ^ (value >>> 16)
  mixed = Math.imul(mixed, 0x85ebca6b)
  mixed ^= mixed >>> 13
  mixed = Math.imul(mixed, 0xc2b2ae35)
  return (mixed ^ (mixed >>> 16)) >>> 0
}

// small string hash, so a country looks the same on every device
export const hashCountryCode = (code: CountryCode): number =>
  mixBits(
    [...code].reduce((hash, letter) => Math.imul(hash ^ letter.charCodeAt(0), 0x9e3779b1) >>> 0, 7)
  )

// themes pick the saturation and lightness, so the hue stays readable on any background
export const getCountryHue = (code: CountryCode): number => hashCountryCode(code) % HUE_COUNT
