/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { COVER_IDS } from '@/passport/covers'
import { stubFirstPaintPage } from '@/test/browser-stubs'
import { THEME_CHOICES } from './themes.ts'

const HTML = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
const FIRST_PAINT_SCRIPT = HTML.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? ''
const THEME_NAMES = THEME_CHOICES.filter(choice => choice !== 'auto')

const runFirstPaint = (options: Parameters<typeof stubFirstPaintPage>[0]) => {
  const { root } = stubFirstPaintPage(options)
  new Function(FIRST_PAINT_SCRIPT)()
  return root.dataset
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the theme on first paint', () => {
  it.each(THEME_NAMES)('wears a linked %s theme', theme => {
    expect(runFirstPaint({ hash: `#v=br&t=${theme}` }).theme).toBe(theme)
  })

  it('wears the saved theme when the link has none', () => {
    expect(runFirstPaint({ saved: { 'stamped-theme': 'rose' } }).theme).toBe('rose')
  })

  it('ignores a linked theme that does not exist', () => {
    const dataset = runFirstPaint({ hash: '#t=neon', saved: { 'stamped-theme': 'rose' } })
    expect(dataset.theme).toBe('rose')
  })

  it.each([
    [false, 'light'],
    [true, 'dark'],
  ])('follows the system when nothing is picked (dark: %s)', (prefersDark, theme) => {
    expect(runFirstPaint({ hash: '#t=neon', prefersDark }).theme).toBe(theme)
  })
})

describe('the passport cover on first paint', () => {
  it.each(COVER_IDS)(
    'wears a saved %s cover, so exports match it before the passport opens',
    cover => {
      expect(runFirstPaint({ saved: { 'stamped-cover': cover } }).cover).toBe(cover)
    }
  )

  it('leaves an unknown cover to the default', () => {
    expect(runFirstPaint({ saved: { 'stamped-cover': 'plaid' } }).cover).toBeUndefined()
  })
})
