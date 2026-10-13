import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { getMapFileName, PROJECTION_IDS } from '../src/map/projections.ts'
import { encodeMap } from './encode.ts'
import { projectCountries } from './project.ts'
import { PROJECTION_FACTORIES } from './projections.ts'
import { COUNTRIES_110M, type CountryCollection, loadSource } from './source.ts'

const OUTPUT_DIR = new URL('../public/maps', import.meta.url).pathname
const EXCLUDED_CODES = new Set(['AQ'])
// natural earth marks land without an iso code (northern cyprus, somaliland) as -99
const NO_CODE = '-99'

const toKilobytes = (bytes: number): string => `${(bytes / 1024).toFixed(1)} KB`

const describeSize = (name: string, content: Uint8Array): string =>
  [
    name.padEnd(24),
    `raw ${toKilobytes(content.length)}`.padEnd(14),
    `gzip ${toKilobytes(gzipSync(content, { level: 9 }).length)}`.padEnd(15),
    `brotli ${toKilobytes(brotliCompressSync(content).length)}`,
  ].join('')

const selectFeatures = (collection: CountryCollection) =>
  collection.features.filter(feature => !EXCLUDED_CODES.has(feature.properties.ISO_A2_EH))

const writeIndex = (codes: (string | null)[]): string => {
  const content = new TextEncoder().encode(JSON.stringify({ codes }))
  writeFileSync(join(OUTPUT_DIR, 'index.json'), content)
  return describeSize('index.json', content)
}

const collection = await loadSource(COUNTRIES_110M)
const features = selectFeatures(collection)
const codes = features.map(({ properties }) =>
  properties.ISO_A2_EH === NO_CODE ? null : properties.ISO_A2_EH.toLowerCase()
)

mkdirSync(OUTPUT_DIR, { recursive: true })
const report = PROJECTION_IDS.map(projection => {
  const content = encodeMap(projectCountries(features, PROJECTION_FACTORIES[projection]))
  const fileName = getMapFileName(projection)
  writeFileSync(join(OUTPUT_DIR, fileName), content)
  return describeSize(fileName, content)
})

console.log([...report, writeIndex(codes)].join('\n'))
