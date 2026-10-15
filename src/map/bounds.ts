import type { MapGeometry } from './format.ts'
import type { ScreenPoint } from './viewport.ts'

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

const boundsCache = new WeakMap<MapGeometry, Bounds[]>()

const measureRings = (rings: readonly Int16Array[]): Bounds => {
  const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  for (const ring of rings) {
    for (let index = 0; index < ring.length; index += 2) {
      const x = ring[index] ?? 0
      const y = ring[index + 1] ?? 0
      bounds.minX = Math.min(bounds.minX, x)
      bounds.minY = Math.min(bounds.minY, y)
      bounds.maxX = Math.max(bounds.maxX, x)
      bounds.maxY = Math.max(bounds.maxY, y)
    }
  }
  return bounds
}

export const getCountryBounds = (geometry: MapGeometry): Bounds[] => {
  const cached = boundsCache.get(geometry)
  if (cached) return cached
  const bounds = geometry.countries.map(({ rings }) => measureRings(rings))
  boundsCache.set(geometry, bounds)
  return bounds
}

export const isInsideBounds = (
  { minX, minY, maxX, maxY }: Bounds,
  { x, y }: ScreenPoint
): boolean => x >= minX && x <= maxX && y >= minY && y <= maxY

const getBoundsCenter = ({ minX, minY, maxX, maxY }: Bounds): ScreenPoint => ({
  x: (minX + maxX) / 2,
  y: (minY + maxY) / 2,
})

const isSmallerThan = ({ minX, minY, maxX, maxY }: Bounds, size: number): boolean =>
  Math.max(maxX - minX, maxY - minY) <= size

interface SmallCountrySearch {
  point: ScreenPoint
  reach: number
  isCandidate: (index: number) => boolean
}

export const findNearestSmall = (
  bounds: readonly Bounds[],
  { point, reach, isCandidate }: SmallCountrySearch
): number | null => {
  let nearest: { index: number | null; distance: number } = { index: null, distance: reach }
  bounds.forEach((box, index) => {
    if (!isSmallerThan(box, reach) || !isCandidate(index)) return
    const center = getBoundsCenter(box)
    const distance = Math.hypot(center.x - point.x, center.y - point.y)
    if (distance <= nearest.distance) nearest = { index, distance }
  })
  return nearest.index
}

interface ReachPick extends SmallCountrySearch {
  hit: number | null
}

// the shape under the point wins, so the reach only rescues a miss
export const pickWithinReach = (
  bounds: readonly Bounds[],
  { hit, ...search }: ReachPick
): number | null => {
  if (hit !== null && search.isCandidate(hit)) return hit
  return findNearestSmall(bounds, search)
}
