import { createCanvasRenderer } from './canvas-renderer.ts'
import type { MapGeometry } from './format.ts'
import { loadCountryCodes, loadGeometry } from './load.ts'
import type { ProjectionId } from './projections.ts'
import type { MapRenderer } from './renderer.ts'

export { PROJECTION_IDS, PROJECTION_LABELS, type ProjectionId } from './projections.ts'

export interface WorldMapOptions {
  projection: ProjectionId
  // defaults to the canvas renderer. pass one to try another way of drawing
  renderer?: MapRenderer
}

export interface WorldMap {
  setProjection: (projection: ProjectionId) => Promise<void>
  setVisited: (codes: Iterable<string>) => void
  destroy: () => void
}

interface WorldMapState {
  geometry: MapGeometry
  codes: (string | null)[]
  visited: ReadonlySet<string>
  latestProjectionRequest: number
}

export const createWorldMap = async (
  canvas: HTMLCanvasElement,
  options: WorldMapOptions
): Promise<WorldMap> => {
  const renderer = options.renderer ?? createCanvasRenderer(canvas)
  const [geometry, codes] = await Promise.all([
    loadGeometry(options.projection),
    loadCountryCodes(),
  ])
  const state: WorldMapState = { geometry, codes, visited: new Set(), latestProjectionRequest: 0 }
  const render = () => renderer.render(state)
  render()

  return {
    setProjection: async projection => {
      state.latestProjectionRequest += 1
      const request = state.latestProjectionRequest
      const next = await loadGeometry(projection)
      // a quicker toggle may have landed while this file was loading
      if (request !== state.latestProjectionRequest) return
      state.geometry = next
      render()
    },
    setVisited: visitedCodes => {
      state.visited = new Set(visitedCodes)
      render()
    },
    destroy: () => renderer.destroy(),
  }
}
