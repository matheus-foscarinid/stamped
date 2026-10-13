export const PROJECTION_IDS = ['equal-earth', 'natural-earth', 'robinson', 'mercator'] as const

export type ProjectionId = (typeof PROJECTION_IDS)[number]

const MAP_RESOLUTION = '110m'

export const getMapFileName = (projection: ProjectionId): string =>
  `${projection}-${MAP_RESOLUTION}.bin`

export const PROJECTION_LABELS: Record<ProjectionId, string> = {
  'equal-earth': 'Equal Earth',
  'natural-earth': 'Natural Earth',
  robinson: 'Robinson',
  mercator: 'Mercator',
}

export const DEFAULT_PROJECTION: ProjectionId = 'equal-earth'
