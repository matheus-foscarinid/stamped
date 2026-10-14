# Stamped

A map of the countries you've visited, shareable as a link.

Click a country or search for it to stamp it. The map lives in the link (`#v=br,jp,pt`), so sharing it is copying the address. No account, no server, no tracking.

## Features

- Every ISO 3166-1 country and territory is searchable, including ones too small to click
- Stats for continents, UN members and share of the world
- Save the map as an image: post (1080 × 1350), story (1080 × 1920) or wide (1200 × 630)
- Your map is saved in the browser, so it's there when you come back
- 11 themes, light and dark, following the system by default
- Works on phones and ultrawide screens

## How it stays fast

The whole app is one HTML file of about 38 KB gzipped, plus one binary map file.

- The map is drawn on a single `<canvas>` from Natural Earth data, which a build step projects, rounds and delta-encodes to binary. No geo code ships to the browser
- The UI is Vue 3.6 in Vapor mode, with no virtual DOM
- Country names come from `Intl.DisplayNames` and flags are emoji, so neither ships as data
- The build inlines the JS and CSS into `index.html` and fails if a source map or a split-off script lands in `dist/`

## Running it

Needs Node 24 (pinned in `mise.toml`).

```bash
npm install
npm run dev      # downloads the map source on first run, then starts Vite
npm run build    # typecheck, build and check dist/
npm run check    # lint, typecheck, unused code and tests
```

## Data

Country shapes come from [Natural Earth](https://www.naturalearthdata.com/) (public domain), version 5.1.2. Some territories Natural Earth folds into their country, such as French Guiana, are split out under their own code.
