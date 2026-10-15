import type { Feature, Geometry, Position } from 'geojson'
import type { CountryProperties } from './source.ts'

// clockwise, or d3 reads it as the rest of the globe
export const squareAt = ([lon, lat]: [number, number], size = 1): Position[][] => [
  [
    [lon, lat],
    [lon, lat + size],
    [lon + size, lat + size],
    [lon + size, lat],
    [lon, lat],
  ],
]

// clockwise like squareAt, with the first point repeated to close it
export const circleAt = (
  [lon, lat]: [number, number],
  radius: number,
  corners = 16
): Position[][] => {
  const ring = Array.from({ length: corners + 1 }, (_, corner) => {
    const angle = (-corner / corners) * Math.PI * 2
    return [lon + radius * Math.cos(angle), lat + radius * Math.sin(angle)]
  })
  return [ring]
}

export const countryFeature = (
  code: string,
  polygons: Position[][][]
): Feature<Geometry, CountryProperties> => ({
  type: 'Feature',
  properties: { ISO_A2_EH: code },
  geometry: { type: 'MultiPolygon', coordinates: polygons },
})
