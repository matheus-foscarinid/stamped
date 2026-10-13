import { type GeoProjection, geoStream } from 'd3-geo'
import type { Feature, Geometry } from 'geojson'
import type { CountryShape, MapGeometry } from '../src/map/format.ts'
import type { CountryProperties } from './source.ts'

const GRID_WIDTH = 4096
const MIN_RING_POINTS = 3

type CountryFeature = Feature<Geometry, CountryProperties>

// the projection's stream clips at the antimeridian, so rings come out already split
const collectProjectedRings = (feature: CountryFeature, projection: GeoProjection): number[][] => {
  const rings: number[][] = []
  let ring: number[] = []
  const sink = {
    point: (x: number, y: number) => ring.push(x, y),
    lineStart: () => {
      ring = []
    },
    lineEnd: () => rings.push(ring),
    polygonStart: () => undefined,
    polygonEnd: () => undefined,
    sphere: () => undefined,
  }
  geoStream(feature, projection.stream(sink))
  return rings
}

const isSamePoint = (points: number[], x: number, y: number): boolean =>
  points.at(-2) === x && points.at(-1) === y

const roundRing = (ring: number[]): Int16Array | null => {
  const points: number[] = []
  for (let index = 0; index < ring.length; index += 2) {
    const x = Math.round(ring[index] ?? 0)
    const y = Math.round(ring[index + 1] ?? 0)
    if (!isSamePoint(points, x, y)) points.push(x, y)
  }
  if (isSamePoint(points, points[0] ?? Number.NaN, points[1] ?? Number.NaN)) points.splice(-2)
  return points.length / 2 >= MIN_RING_POINTS ? Int16Array.from(points) : null
}

const projectCountry = (feature: CountryFeature, projection: GeoProjection): CountryShape => ({
  rings: collectProjectedRings(feature, projection)
    .map(roundRing)
    .filter(ring => ring !== null),
})

const measureHeight = (countries: CountryShape[]): number => {
  let maxY = 0
  for (const { rings } of countries) {
    for (const ring of rings) {
      for (let index = 1; index < ring.length; index += 2) maxY = Math.max(maxY, ring[index] ?? 0)
    }
  }
  return maxY + 1
}

export const projectCountries = (
  features: CountryFeature[],
  createProjection: () => GeoProjection
): MapGeometry => {
  const projection = createProjection().fitWidth(GRID_WIDTH, {
    type: 'FeatureCollection',
    features,
  })
  const countries = features.map(feature => projectCountry(feature, projection))
  return { width: GRID_WIDTH, height: measureHeight(countries), countries }
}
