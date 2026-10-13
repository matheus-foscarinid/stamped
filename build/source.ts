import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { FeatureCollection, Geometry } from 'geojson'

export interface CountryProperties {
  ISO_A2_EH: string
}

export type CountryCollection = FeatureCollection<Geometry, CountryProperties>

interface MapSource {
  url: string
  sha256: string
  path: string
}

export const COUNTRIES_110M: MapSource = {
  url: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_admin_0_countries.geojson',
  sha256: '6866c877d39cba9c357620878839b336d569f8c662d3cfab4cb1dbe2d39c977f',
  path: new URL('../data/source/ne_110m_admin_0_countries.geojson', import.meta.url).pathname,
}

const hashOf = (content: Buffer): string => createHash('sha256').update(content).digest('hex')

const downloadSource = async (source: MapSource): Promise<Buffer> => {
  const response = await fetch(source.url)
  if (!response.ok) throw new Error(`download failed (${response.status}): ${source.url}`)
  const content = Buffer.from(await response.arrayBuffer())
  if (hashOf(content) !== source.sha256) throw new Error(`checksum mismatch: ${source.url}`)
  mkdirSync(dirname(source.path), { recursive: true })
  writeFileSync(source.path, content)
  return content
}

const readCachedSource = (source: MapSource): Buffer | null => {
  if (!existsSync(source.path)) return null
  const content = readFileSync(source.path)
  return hashOf(content) === source.sha256 ? content : null
}

export const loadSource = async (source: MapSource): Promise<CountryCollection> => {
  const content = readCachedSource(source) ?? (await downloadSource(source))
  return JSON.parse(content.toString('utf8')) as CountryCollection
}
