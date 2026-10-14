import type { Feature, Geometry, Polygon, Position } from 'geojson'
import type { CountryProperties } from './source.ts'

type CountryFeature = Feature<Geometry, CountryProperties>

interface OverseasPart {
  country: string
  territory: string
  isInside: (center: Position) => boolean
}

// natural earth folds these into their country, but they have their own iso code
const OVERSEAS_PARTS: OverseasPart[] = [
  { country: 'FR', territory: 'GF', isInside: ([lon = 0, lat = 0]) => lon < -40 && lat < 15 },
  { country: 'NO', territory: 'SJ', isInside: ([, lat = 0]) => lat > 74 },
]

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
  const territories = parts.map(({ territory, isInside }) => {
    const isPart = (polygon: Polygon['coordinates']) => isInside(getRingCenter(polygon[0] ?? []))
    const polygons = remaining.filter(isPart)
    remaining = remaining.filter(polygon => !isPart(polygon))
    return withPolygons(feature, polygons, territory)
  })
  const country = withPolygons(feature, remaining, feature.properties.ISO_A2_EH)
  return [country, ...territories.filter(hasPolygons)]
}

export const splitOverseasParts = (features: CountryFeature[]): CountryFeature[] =>
  features.flatMap(splitFeature)
