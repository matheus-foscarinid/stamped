import { describe, expect, it } from 'vitest'
import docsLogo from '../../docs/logo.svg?raw'
import docsLogoDark from '../../docs/logo-dark.svg?raw'
import { buildLogoDataUrl, buildLogoSvg } from './logo.ts'

const LIGHT = { frame: '#5c5c63', globe: '#000000' }
const DARK = { frame: '#a3a3aa', globe: '#ffffff' }

describe('buildLogoSvg', () => {
  it('paints the frame and the globe in their own colours', () => {
    const svg = buildLogoSvg({ frame: '#111111', globe: '#222222' })
    expect(svg).toContain('fill="#111111"')
    expect(svg).toContain('fill="#222222"')
    expect(svg).toContain('stroke="#222222"')
  })

  it.each([
    ['logo.svg', docsLogo, LIGHT],
    ['logo-dark.svg', docsLogoDark, DARK],
  ])('matches the committed readme copy in %s', (_fileName, docsCopy, colors) => {
    expect(docsCopy.trim()).toBe(buildLogoSvg(colors))
  })
})

describe('buildLogoDataUrl', () => {
  it('escapes what would break the url or end the href early', () => {
    const url = buildLogoDataUrl(LIGHT)
    expect(url).toMatch(/^data:image\/svg\+xml,%3Csvg /)
    expect(url).not.toMatch(/[<>"#]/)
  })

  it('decodes back to the same drawing', () => {
    const url = buildLogoDataUrl(LIGHT)
    const decoded = decodeURIComponent(url.replace('data:image/svg+xml,', ''))
    expect(decoded).toBe(buildLogoSvg(LIGHT).replaceAll('"', "'"))
  })
})
