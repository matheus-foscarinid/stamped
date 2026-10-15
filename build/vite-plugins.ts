import type { Plugin, Rolldown } from 'vite'
import { APP_NAME, buildAppIconSvg, buildLogoDataUrl } from '../src/brand/logo.ts'
import { DEFAULT_PROJECTION, getMapFileName } from '../src/map/projections.ts'

// a closing tag inside inlined code would end the script element early
const escapeForInlineScript = (code: string): string => code.replace(/<\/script/gi, '<\\/script')

const findHtml = (bundle: Rolldown.OutputBundle): Rolldown.OutputAsset | undefined => {
  const html = bundle['index.html']
  return html?.type === 'asset' ? html : undefined
}

// the script goes to the end of the body, so the browser reads the css before 140 kb of js.
// a module script waits for the parse either way
const inlineChunk = (html: string, chunk: Rolldown.OutputChunk): string =>
  html
    .replace(
      new RegExp(`<script type="module" crossorigin src="[^"]*${chunk.fileName}"></script>`),
      ''
    )
    .replace(
      '</body>',
      () => `<script type="module">${escapeForInlineScript(chunk.code)}</script></body>`
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
  name: 'stamped:inline-entry-assets',
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
  name: 'stamped:preload-default-map',
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
  name: 'stamped:inject-favicon',
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

const APP_ICON_FILE = 'app-icon.svg'
const MANIFEST_FILE = 'manifest.webmanifest'
// the light theme's page colour, the same one index.html starts with
const APP_BACKGROUND = '#f7f7f9'

const buildManifest = (base: string): string =>
  JSON.stringify({
    name: APP_NAME,
    short_name: APP_NAME,
    description: 'Stamp the countries you have been to on a world map.',
    start_url: base,
    scope: base,
    display: 'standalone',
    background_color: APP_BACKGROUND,
    theme_color: APP_BACKGROUND,
    icons: [
      {
        src: `${base}${APP_ICON_FILE}`,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  })

const buildAppFiles = (base: string): Record<string, { type: string; source: string }> => ({
  [APP_ICON_FILE]: {
    type: 'image/svg+xml',
    source: buildAppIconSvg({ ...STARTING_FAVICON_COLORS, tile: APP_BACKGROUND }),
  },
  [MANIFEST_FILE]: { type: 'application/manifest+json', source: buildManifest(base) },
})

// lets phones add the map to the home screen and open it without the browser bars
export const emitAppManifest = (base: string): Plugin => ({
  name: 'stamped:emit-app-manifest',
  configureServer: server => {
    const files = buildAppFiles(base)
    server.middlewares.use((request, response, next) => {
      const file = files[request.url?.slice(base.length) ?? '']
      if (!file) return next()
      response.setHeader('Content-Type', file.type)
      response.end(file.source)
    })
  },
  generateBundle() {
    for (const [fileName, { source }] of Object.entries(buildAppFiles(base))) {
      this.emitFile({ type: 'asset', fileName, source })
    }
  },
  transformIndexHtml: () => [
    {
      tag: 'link',
      attrs: { rel: 'manifest', href: `${base}${MANIFEST_FILE}` },
      injectTo: 'head' as const,
    },
  ],
})
