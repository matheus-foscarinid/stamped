import { describe, expect, it } from 'vitest'
import { readThemeFromHash, writeThemeToHash } from './theme-link.ts'

describe('readThemeFromHash', () => {
  it('finds the theme among the lists', () => {
    expect(readThemeFromHash('#v=br&t=gruvbox&w=is')).toBe('gruvbox')
  })

  it.each(['', '#v=br', '#t=neon', '#t=auto', '#t='])('finds no theme in %j', hash => {
    expect(readThemeFromHash(hash)).toBeNull()
  })
})

describe('writeThemeToHash', () => {
  it('adds the theme and keeps the lists', () => {
    expect(writeThemeToHash('#v=br,jp', 'dracula')).toBe('#v=br,jp&t=dracula')
  })

  it('swaps a theme already in the link', () => {
    expect(writeThemeToHash('#t=rose&v=br', 'ocean')).toBe('#t=ocean&v=br')
  })

  it('leaves auto out, so the viewer gets their own system scheme', () => {
    expect(writeThemeToHash('#v=br&t=rose', 'auto')).toBe('#v=br')
    expect(writeThemeToHash('#t=rose', 'auto')).toBe('')
  })
})
