import { COUNTRY_CODES, type CountryCode } from '@/countries'
import { getStampStyle, type StampShape } from '@/passport/stamp-style'

export const findCodeWithShape = (shape: StampShape): CountryCode => {
  const code = COUNTRY_CODES.find(candidate => getStampStyle(candidate).shape === shape)
  if (!code) throw new Error(`no country has a ${shape} stamp`)
  return code
}
