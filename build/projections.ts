import { type GeoProjection, geoEqualEarth, geoMercator, geoNaturalEarth1 } from 'd3-geo'
import { geoRobinson } from 'd3-geo-projection'
import type { ProjectionId } from '../src/map/projections.ts'

export const PROJECTION_FACTORIES: Record<ProjectionId, () => GeoProjection> = {
  'equal-earth': geoEqualEarth,
  'natural-earth': geoNaturalEarth1,
  robinson: geoRobinson,
  mercator: geoMercator,
}
