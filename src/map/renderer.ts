import type { MapGeometry } from './format.ts'

export interface MapScene {
  geometry: MapGeometry
  codes: (string | null)[]
  visited: ReadonlySet<string>
}

// the swap point for drawing. the facade only talks to this, never to canvas directly
export interface MapRenderer {
  render: (scene: MapScene) => void
  destroy: () => void
}
