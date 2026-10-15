import { readHashParams, writeHashParams } from '@/share/link'
import { isThemeName, type ThemeChoice, type ThemeName } from './themes.ts'

const THEME_PARAM = 't'

export const readThemeFromHash = (hash: string): ThemeName | null => {
  const theme = readHashParams(hash).get(THEME_PARAM)
  return isThemeName(theme) ? theme : null
}

// auto stays out, so the viewer's own system scheme decides
export const writeThemeToHash = (hash: string, theme: ThemeChoice): string => {
  const params = readHashParams(hash)
  if (theme === 'auto') params.delete(THEME_PARAM)
  else params.set(THEME_PARAM, theme)
  return writeHashParams(params)
}
