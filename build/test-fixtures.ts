import type { Feature, Geometry, Position } from 'geojson'
import type { CountryProperties } from './source.ts'

export const squareAt = ([lon, lat]: [number, number]): Position[][] => [
  [
    [lon, lat],
    [lon + 1, lat],
    [lon + 1, lat + 1],
    [lon, lat],
  ],
]

export const countryFeature = (
  code: string,
  polygons: Position[][][]
): Feature<Geometry, CountryProperties> => ({
  type: 'Feature',
  properties: { ISO_A2_EH: code },
  geometry: { type: 'MultiPolygon', coordinates: polygons },
})
