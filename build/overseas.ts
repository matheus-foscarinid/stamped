import type { Feature, Geometry, Polygon, Position } from 'geojson'
import type { CountryProperties } from './source.ts'

type CountryFeature = Feature<Geometry, CountryProperties>

// in degrees. a side left out runs to the edge of the world
interface Box {
  west?: number
  east?: number
  south?: number
  north?: number
}

interface OverseasPart {
  country: string
  territory: string
  box: Box
}

// natural earth folds these into their country, but they have their own iso code
const OVERSEAS_PARTS: OverseasPart[] = [
  { country: 'FR', territory: 'GP', box: { east: -60, south: 15.7, north: 20 } },
  { country: 'FR', territory: 'MQ', box: { east: -60, south: 14, north: 15.7 } },
  { country: 'FR', territory: 'GF', box: { east: -40, north: 10 } },
  { country: 'FR', territory: 'RE', box: { west: 50, north: -15 } },
  { country: 'FR', territory: 'YT', box: { west: 40, east: 50, south: -15, north: -10 } },
  { country: 'NL', territory: 'BQ', box: { east: -60 } },
  { country: 'NO', territory: 'SJ', box: { south: 74 } },
]

const isInsideBox = (
  [lon = 0, lat = 0]: Position,
  { west = -180, east = 180, south = -90, north = 90 }: Box
): boolean => lon >= west && lon <= east && lat >= south && lat <= north

const getRingCenter = (ring: Position[]): Position => {
  let lonSum = 0
  let latSum = 0
  for (const [lon = 0, lat = 0] of ring) {
    lonSum += lon
    latSum += lat
  }
  return [lonSum / ring.length, latSum / ring.length]
}

const hasPolygons = ({ geometry }: CountryFeature): boolean =>
  geometry.type === 'MultiPolygon' && geometry.coordinates.length > 0

const withPolygons = (
  feature: CountryFeature,
  polygons: Polygon['coordinates'][],
  code: string
): CountryFeature => ({
  ...feature,
  properties: { ...feature.properties, ISO_A2_EH: code },
  geometry: { type: 'MultiPolygon', coordinates: polygons },
})

const splitFeature = (feature: CountryFeature): CountryFeature[] => {
  const parts = OVERSEAS_PARTS.filter(({ country }) => country === feature.properties.ISO_A2_EH)
  if (parts.length === 0 || feature.geometry.type !== 'MultiPolygon') return [feature]
  let remaining = feature.geometry.coordinates
  const territories = parts.map(({ territory, box }) => {
    const isPart = (polygon: Polygon['coordinates']) =>
      isInsideBox(getRingCenter(polygon[0] ?? []), box)
    const polygons = remaining.filter(isPart)
    remaining = remaining.filter(polygon => !isPart(polygon))
    return withPolygons(feature, polygons, territory)
  })
  const country = withPolygons(feature, remaining, feature.properties.ISO_A2_EH)
  return [country, ...territories.filter(hasPolygons)]
}

export const splitOverseasParts = (features: CountryFeature[]): CountryFeature[] =>
  features.flatMap(splitFeature)
