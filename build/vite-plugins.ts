import type { Plugin, Rolldown } from 'vite'
import { buildLogoDataUrl } from '../src/brand/logo.ts'
import { DEFAULT_PROJECTION, getMapFileName } from '../src/map/projections.ts'

// a closing tag inside inlined code would end the script element early
const escapeForInlineScript = (code: string): string => code.replace(/<\/script/gi, '<\\/script')

const findHtml = (bundle: Rolldown.OutputBundle): Rolldown.OutputAsset | undefined => {
  const html = bundle['index.html']
  return html?.type === 'asset' ? html : undefined
}

const inlineChunk = (html: string, chunk: Rolldown.OutputChunk): string =>
  html.replace(
    new RegExp(`<script type="module" crossorigin src="[^"]*${chunk.fileName}"></script>`),
    () => `<script type="module">${escapeForInlineScript(chunk.code)}</script>`
  )

const inlineStylesheet = (html: string, asset: Rolldown.OutputAsset): string =>
  html.replace(
    new RegExp(`<link rel="stylesheet" crossorigin href="[^"]*${asset.fileName}">`),
    () => `<style>${String(asset.source)}</style>`
  )

// returns the html with this output inlined, or null when it isn't an entry asset
const inlineOutput = (
  html: string,
  output: Rolldown.OutputChunk | Rolldown.OutputAsset
): string | null => {
  if (output.type === 'chunk') return output.isEntry ? inlineChunk(html, output) : null
  return output.fileName.endsWith('.css') ? inlineStylesheet(html, output) : null
}

// the whole app is a few kb, so one html response beats a round trip per asset
export const inlineEntryAssets = (): Plugin => ({
  name: 'travel-tracker:inline-entry-assets',
  apply: 'build',
  enforce: 'post',
  generateBundle: (_options, bundle) => {
    const html = findHtml(bundle)
    if (!html) return
    let source = String(html.source)
    for (const [fileName, output] of Object.entries(bundle)) {
      const inlined = inlineOutput(source, output)
      if (inlined === null) continue
      source = inlined
      delete bundle[fileName]
    }
    html.source = source
  },
})

// starts the map download while the html is still parsing, instead of after the js runs
export const preloadDefaultMap = (base: string): Plugin => ({
  name: 'travel-tracker:preload-default-map',
  transformIndexHtml: () =>
    [getMapFileName(DEFAULT_PROJECTION), 'index.json'].map(file => ({
      tag: 'link',
      attrs: { rel: 'preload', href: `${base}maps/${file}`, as: 'fetch', crossorigin: '' },
      injectTo: 'head-prepend' as const,
    })),
})

// the light theme's colours. the app repaints it for the active theme as soon as it runs
const STARTING_FAVICON_COLORS = { frame: '#5c5c63', globe: '#000000' }

export const injectFavicon = (): Plugin => ({
  name: 'travel-tracker:inject-favicon',
  transformIndexHtml: () => [
    {
      tag: 'link',
      attrs: {
        rel: 'icon',
        type: 'image/svg+xml',
        href: buildLogoDataUrl(STARTING_FAVICON_COLORS),
      },
      injectTo: 'head' as const,
    },
  ],
})
