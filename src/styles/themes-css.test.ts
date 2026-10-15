/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { COVER_IDS } from '@/passport/covers'
import { THEME_CHOICES } from '@/theme/themes'

// vitest hands css imports back empty, even with ?raw, so this reads the file itself
const CSS = readFileSync(new URL('./base.css', import.meta.url), 'utf8')
const DARK_THEMES = ['dark', 'dusk', 'forest', 'midnight', 'gruvbox', 'dracula']
const PALETTE_THEMES = THEME_CHOICES.filter(choice => choice !== 'auto' && choice !== 'light')

const findRuleBodies = (selector: string): string[] =>
  CSS.split('\n}\n')
    .map(rule => rule.trim())
    .filter(rule => rule.slice(0, rule.indexOf('{') + 1).includes(selector))

describe('theme palettes in base.css', () => {
  it.each(PALETTE_THEMES)('gives %s exactly one palette of its own', theme => {
    const own = findRuleBodies(`[data-theme="${theme}"] {`).filter(rule =>
      rule.includes('--page-bg')
    )
    expect(own).toHaveLength(1)
  })

  it.each(['light', ...PALETTE_THEMES])('gives %s its own wishlist colour on the map', theme => {
    const [own] = findRuleBodies(`[data-theme="${theme}"] {`).filter(rule =>
      rule.includes('--page-bg')
    )
    expect(own).toContain('--map-wishlist:')
  })

  it('shares the dark glass, paper and color scheme across every dark theme', () => {
    const [group] = findRuleBodies('[data-theme="dark"],')
    expect(group).toBeDefined()
    for (const theme of DARK_THEMES) expect(group).toContain(`[data-theme="${theme}"]`)
    expect(group).toContain('color-scheme: dark')
    expect(group).toContain('--passport-paper:')
    expect(group).not.toContain('--page-bg')
  })
})

describe('passport covers in base.css', () => {
  it.each(COVER_IDS)('gives %s its own cover and foil, so swatches never borrow them', cover => {
    const [rule] = findRuleBodies(`[data-cover="${cover}"] {`)
    expect(rule).toContain('--passport-cover:')
    expect(rule).toContain('--passport-foil:')
  })
})
