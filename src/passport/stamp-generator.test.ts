import { describe, expect, it } from 'vitest'
import { findCodeWithShape } from '@/test/stamps'
import { buildStampDataUrl, buildStampSvg } from './stamp-generator.ts'
import { STAMP_SHAPES, type StampShape } from './stamp-style.ts'

const CURVED_SHAPES: readonly StampShape[] = ['round', 'oval']
const LABELS = { name: 'Trinidad & Tobago', continent: 'North America' }
const ROUND_CODE = findCodeWithShape('round')

describe('buildStampSvg', () => {
  it.each(STAMP_SHAPES)('labels the %s stamp with its name and continent', shape => {
    const svg = buildStampSvg({ code: findCodeWithShape(shape), ...LABELS })
    const labelTag = CURVED_SHAPES.includes(shape) ? 'textPath' : 'text'
    expect(svg).toContain(`TRINIDAD &#38; TOBAGO</${labelTag}>`)
    expect(svg).toContain(`NORTH AMERICA</${labelTag}>`)
    expect(svg.includes('<textPath')).toBe(CURVED_SHAPES.includes(shape))
  })

  it('escapes names and fonts, so odd characters still make a valid svg', () => {
    const svg = buildStampSvg({
      code: ROUND_CODE,
      name: 'A <b> "C"',
      continent: 'Europe',
      font: '"Space Grotesk", sans-serif',
    })
    expect(svg).toContain('A &#60;B&#62; &#34;C&#34;</textPath>')
    expect(svg).toContain('font-family="&#34;Space Grotesk&#34;, sans-serif"')
    expect(svg).not.toContain('<b>')
  })

  it('inks in the page colour unless told otherwise', () => {
    expect(buildStampSvg({ code: ROUND_CODE, ...LABELS })).toContain('stroke="currentColor"')
    const inked = buildStampSvg({ code: ROUND_CODE, ...LABELS, color: 'hsl(200 62% 38%)' })
    expect(inked).toContain('stroke="hsl(200 62% 38%)"')
    expect(inked).not.toContain('currentColor')
  })
})

describe('buildStampDataUrl', () => {
  it('wraps the same svg, so it loads as an image', () => {
    const url = buildStampDataUrl({ code: ROUND_CODE, ...LABELS })
    const [prefix, encoded = ''] = url.split(',')
    expect(prefix).toBe('data:image/svg+xml;charset=utf-8')
    expect(decodeURIComponent(encoded)).toBe(buildStampSvg({ code: ROUND_CODE, ...LABELS }))
  })
})
