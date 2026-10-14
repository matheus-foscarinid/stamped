import type { MapGeometry } from './format.ts'
import type { ScreenPoint, ScreenSize, Viewport } from './viewport.ts'

export type MarkState = 'visited' | 'wishlist' | 'unmarked'

export interface MapScene {
  geometry: MapGeometry
  codes: (string | null)[]
  // unmarked countries are left out
  marks: ReadonlyMap<string, MarkState>
  // countries still easing into their color, from 0 to 1. settled ones are left out
  fading: ReadonlyMap<string, number>
  // what a fading country looked like before, drawn under the new color
  fadingFrom: ReadonlyMap<string, MarkState>
  hoveredIndex: number | null
  viewport: Viewport
}

// the swap point for drawing. the facade only talks to this, never to canvas directly
export interface MapRenderer {
  // matches the drawing surface to the element's current size and returns it
  resize: () => ScreenSize
  render: (scene: MapScene) => void
  // index of the country under a point in grid units, or null over water
  pick: (geometry: MapGeometry, gridPoint: ScreenPoint) => number | null
  destroy: () => void
}
