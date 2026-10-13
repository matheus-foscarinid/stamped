import { decodeMap } from './decode.ts'
import type { MapGeometry } from './format.ts'
import { getMapFileName, type ProjectionId } from './projections.ts'

const MAPS_URL = `${import.meta.env.BASE_URL}maps/`

interface MapIndex {
  // natural earth iso code per country, in file order. null is land without a code
  codes: (string | null)[]
}

const geometryCache = new Map<ProjectionId, Promise<MapGeometry>>()
let indexRequest: Promise<MapIndex> | null = null

const fetchOk = async (url: string): Promise<Response> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`failed to load ${url} (${response.status})`)
  return response
}

const fetchGeometry = async (projection: ProjectionId): Promise<MapGeometry> => {
  const response = await fetchOk(`${MAPS_URL}${getMapFileName(projection)}`)
  return decodeMap(await response.arrayBuffer())
}

export const loadGeometry = (projection: ProjectionId): Promise<MapGeometry> => {
  const cached = geometryCache.get(projection)
  if (cached !== undefined) return cached
  const request = fetchGeometry(projection)
  geometryCache.set(projection, request)
  request.catch(() => geometryCache.delete(projection))
  return request
}

export const loadCountryCodes = async (): Promise<MapIndex['codes']> => {
  indexRequest ??= fetchOk(`${MAPS_URL}index.json`).then(response => response.json())
  const { codes } = await indexRequest
  return codes
}
