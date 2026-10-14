# Stamped

Open-source map of the countries you've visited, shareable as a link. All code, data and assets are original or used under a compatible license.

The top priority is weight and speed. Every dependency, byte and runtime step has to earn its place.

## Stack

- **UI**: Vue 3.6 Vapor (pinned RC). Every SFC uses `<script setup vapor lang="ts">`, enforced by Biome's `useVueVapor`. The app mounts with `createVaporApp`
- **Map**: drawn on a single `<canvas>`. Hover and clicks are resolved with `Path2D` + `isPointInPath`
- **Geometry**: Natural Earth GeoJSON is the source. A build step projects it, rounds it to a 4096-wide grid and delta-encodes it to binary. No geo code ships to the browser
- **Countries**: ISO 3166-1 alpha-2 codes are the identity everywhere. Names come from `Intl.DisplayNames`, flags are emoji built from the code
- **Tooling**: Vite 8, TypeScript 6 (not 7, which dropped the JS API `vue-tsc` needs), Biome, Knip, husky + lint-staged
- **Node**: 24, pinned in `mise.toml`

## Commands

- `npm run dev`: dev server
- `npm run build`: typecheck, build, then `check:dist`
- `npm run check`: Biome + typecheck + Knip
- `npm run lint:fix`: Biome with fixes and formatting
- `npm run build:map`: download the pinned source and regenerate `public/maps/*.bin`

## Architecture

```
build/           source GeoJSON -> project -> round -> delta-encode -> public/maps/
src/map/         facade over decoder, renderer, hit-testing and viewport
src/countries/   catalog.ts (iso codes + aliases, add a country = add a code), search, names, flags, the visited and wishlist lists
src/share/       link codec (#v=br,in&w=is for the wishlist), export card layout and drawing, file saving
src/ui/          Vapor components and their hooks, including the passport book (cover, pages, nav)
src/passport/    the cover catalog (colours live on [data-cover] in base.css), stamp look per country, the stamp generator (buildStampSvg, one svg for the page and exports) and the passport image. Colours come from getCountryHue in src/countries/
src/brand/       the logo drawing, shared by the header, the favicon and docs/logo*.svg
src/styles/      shared tokens, theme palettes on [data-theme] and the css token reader
src/theme/       theme catalog, saved choice and the auto (system) theme
src/i18n/        UI text. English ships in the page, the other languages load from public/locales/ on demand
src/test/        browser stubs, since tests run in node
src/use*.ts      page state. useCountryLists keeps the visited and wishlist countries in the link and saves your edits
src/main.ts      mounts the app
```

- The map module is a facade. Callers use `createWorldMap(canvas, options)` and its methods, never the decoder or renderer directly. The renderer is swappable through an optional override, with canvas as the default. Exported images go through `drawWorldSnapshot`, which always draws with canvas
- The encoder (`build/`) and decoder (`src/map/`) share one format contract in `src/map/format.ts`. Change both together, and bump `MAP_FORMAT_VERSION` when the layout changes
- `build/` runs on plain Node (type stripping), so the `src/map/` files it imports use relative imports with the `.ts` extension and no `@/` alias
- Disputed land is selectable. Kosovo uses `xk`, Northern Cyprus and Somaliland get private-use codes (`xn`, `xs`) in `build/build-map.ts`, with their names in `src/countries/names.ts`. Abkhazia, South Ossetia and Transnistria (`xa`, `xo`, `xt`) have no shape in the 110m source, so they are search-only. `src/countries/disputed.ts` lists what gets the Disputed tag
- Natural Earth folds some territories into their country (French Guiana into France, Svalbard into Norway). `build/overseas.ts` splits them out under their own ISO code. Add a row there for any new case
- Every country is searchable, including ones too small to draw or click
- Country names come from `Intl.DisplayNames`. Continent names live in the locale files, since Chrome can't name M49 regions. A test fails if a locale file misses a key or a placeholder

## Rules

- The production build inlines the entry JS and CSS into `index.html` and preloads the default projection's map file (`build/vite-plugins.ts`). Change `DEFAULT_PROJECTION` and the preload follows
- The favicon is the logo drawn in the active theme's colours. `build/vite-plugins.ts` injects the light one and `applyTheme` repaints it. A test fails if `docs/logo*.svg` drift from `src/brand/logo.ts`
- `index.html` sets `data-theme` before first paint with a tiny inline script. It mirrors `src/theme/themes.ts`, so change the storage key or the auto rule in both
- Never ship source maps. `vite.config.ts` disables them and `check:dist` fails the build if a `.map` file or an oversized file lands in `dist/`
- Imports more than one level up go through the `@/` alias
- Generated files (`public/maps/`) and downloaded sources (`data/source/`) are not committed
- One atomic commit per small goal. Never push unless asked
