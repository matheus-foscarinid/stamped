import type { Rolldown } from 'vite'
import { describe, expect, it } from 'vitest'
import { inlineEntryAssets } from './vite-plugins.ts'

const BUILT_HTML = [
  '<html><head>',
  '<script type="module" crossorigin src="/assets/index-abc.js"></script>',
  '<link rel="stylesheet" crossorigin href="/assets/index-abc.css">',
  '</head><body><div id="app"></div></body></html>',
].join('')

const buildBundle = () =>
  ({
    'index.html': { type: 'asset', fileName: 'index.html', source: BUILT_HTML },
    'assets/index-abc.js': {
      type: 'chunk',
      fileName: 'assets/index-abc.js',
      isEntry: true,
      code: 'mount("</script>")',
    },
    'assets/index-abc.css': { type: 'asset', fileName: 'assets/index-abc.css', source: 'body{}' },
  }) as unknown as Rolldown.OutputBundle

const runPlugin = (bundle: Rolldown.OutputBundle): string => {
  const plugin = inlineEntryAssets()
  const generateBundle = plugin.generateBundle as (options: unknown, bundle: unknown) => void
  generateBundle({}, bundle)
  const html = bundle['index.html']
  return html?.type === 'asset' ? String(html.source) : ''
}

describe('inlineEntryAssets', () => {
  it('inlines the css in the head and the entry script at the end of the body', () => {
    const html = runPlugin(buildBundle())
    expect(html.indexOf('<style>body{}</style>')).toBeLessThan(html.indexOf('</head>'))
    expect(html.indexOf('<script type="module">')).toBeGreaterThan(html.indexOf('<div id="app">'))
    expect(html).not.toContain('src="/assets/index-abc.js"')
  })

  it('escapes a closing script tag inside the code', () => {
    expect(runPlugin(buildBundle())).toContain('mount("<\\/script>")')
  })

  it('drops the inlined files from the output', () => {
    const bundle = buildBundle()
    runPlugin(bundle)
    expect(Object.keys(bundle)).toEqual(['index.html'])
  })
})
