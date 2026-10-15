import { type GeoProjection, geoCentroid, geoStream } from 'd3-geo'
import type { Feature, Geometry } from 'geojson'
import type { CountryShape, MapGeometry } from '../src/map/format.ts'
import { simplifyLine } from './simplify.ts'
import type { CountryProperties } from './source.ts'

const GRID_WIDTH = 8192
const MIN_RING_POINTS = 3
// in grid units, about a third of a screen pixel at full width
const SIMPLIFY_TOLERANCE = 2
// small islands simplify less so malta keeps its shape
const SMALL_RING_SHARE = 0.05
const DOT = { radius: 2, corners: 4 }

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

const measureExtent = (points: number[]): number => {
  const box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  for (let index = 0; index < points.length; index += 2) {
    const [x = 0, y = 0] = [points[index], points[index + 1]]
    box.minX = Math.min(box.minX, x)
    box.maxX = Math.max(box.maxX, x)
    box.minY = Math.min(box.minY, y)
    box.maxY = Math.max(box.maxY, y)
  }
  return Math.max(box.maxX - box.minX, box.maxY - box.minY)
}

const readTolerance = (points: number[]): number =>
  Math.min(SIMPLIFY_TOLERANCE, measureExtent(points) * SMALL_RING_SHARE)

const snapToGrid = (ring: number[]): number[] => {
  const points: number[] = []
  for (let index = 0; index < ring.length; index += 2) {
    const x = Math.round(ring[index] ?? 0)
    const y = Math.round(ring[index + 1] ?? 0)
    if (!isSamePoint(points, x, y)) points.push(x, y)
  }
  return points
}

// rings close implicitly, so a repeated first point is dropped
const dropClosingPoint = (points: number[]): number[] =>
  isSamePoint(points, points[0] ?? Number.NaN, points[1] ?? Number.NaN)
    ? points.slice(0, -2)
    : points

const roundRing = (ring: number[]): Int16Array | null => {
  const points = snapToGrid(ring)
  const simplified = dropClosingPoint(simplifyLine(points, readTolerance(points)))
  return simplified.length / 2 >= MIN_RING_POINTS ? Int16Array.from(simplified) : null
}

const traceDot = ([x, y]: [number, number]): Int16Array => {
  const points: number[] = []
  for (let corner = 0; corner < DOT.corners; corner++) {
    const angle = (corner / DOT.corners) * Math.PI * 2
    points.push(
      Math.round(x + DOT.radius * Math.cos(angle)),
      Math.round(y + DOT.radius * Math.sin(angle))
    )
  }
  return Int16Array.from(points)
}

// too small for the grid, so a dot keeps it clickable
const projectCountry = (feature: CountryFeature, projection: GeoProjection): CountryShape => {
  const rings = collectProjectedRings(feature, projection)
    .map(roundRing)
    .filter(ring => ring !== null)
  const center = projection(geoCentroid(feature))
  if (rings.length > 0 || !center) return { rings }
  return { rings: [traceDot(center)] }
}

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
