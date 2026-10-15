import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { geoArea } from 'd3-geo'
import { getMapFileName, PROJECTION_IDS } from '../src/map/projections.ts'
import { encodeMap } from './encode.ts'
import { splitOverseasParts } from './overseas.ts'
import { projectCountries } from './project.ts'
import { PROJECTION_FACTORIES } from './projections.ts'
import {
  COUNTRIES_50M,
  type CountryCollection,
  type CountryProperties,
  loadSource,
} from './source.ts'

const OUTPUT_DIR = new URL('../public/maps', import.meta.url).pathname
const EXCLUDED_CODES = new Set(['AQ'])
// natural earth marks land without an iso code as -99. these get our private-use codes
const NO_CODE = '-99'
const UNLISTED_CODES: Record<string, string> = { CYN: 'xn', SOL: 'xs' }

const toKilobytes = (bytes: number): string => `${(bytes / 1024).toFixed(1)} KB`

const describeSize = (name: string, content: Uint8Array): string =>
  [
    name.padEnd(24),
    `raw ${toKilobytes(content.length)}`.padEnd(14),
    `gzip ${toKilobytes(gzipSync(content, { level: 9 }).length)}`.padEnd(15),
    `brotli ${toKilobytes(brotliCompressSync(content).length)}`,
  ].join('')

// biggest first, so small countries paint over the ones around them
const selectFeatures = (collection: CountryCollection) =>
  splitOverseasParts(
    collection.features.filter(feature => !EXCLUDED_CODES.has(feature.properties.ISO_A2_EH))
  ).sort((first, second) => geoArea(second) - geoArea(first))

const writeIndex = (codes: (string | null)[]): string => {
  const content = new TextEncoder().encode(JSON.stringify({ codes }))
  writeFileSync(join(OUTPUT_DIR, 'index.json'), content)
  return describeSize('index.json', content)
}

const collection = await loadSource(COUNTRIES_50M)
const features = selectFeatures(collection)
const readCode = ({ ISO_A2_EH, ADM0_A3 = '' }: CountryProperties): string | null => {
  if (ISO_A2_EH !== NO_CODE) return ISO_A2_EH.toLowerCase()
  return UNLISTED_CODES[ADM0_A3] ?? null
}

const codes = features.map(({ properties }) => readCode(properties))

mkdirSync(OUTPUT_DIR, { recursive: true })
const report = PROJECTION_IDS.map(projection => {
  const content = encodeMap(projectCountries(features, PROJECTION_FACTORIES[projection]))
  const fileName = getMapFileName(projection)
  writeFileSync(join(OUTPUT_DIR, fileName), content)
  return describeSize(fileName, content)
})

console.log([...report, writeIndex(codes)].join('\n'))
