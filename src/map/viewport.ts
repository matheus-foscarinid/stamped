import type { MapGeometry } from './format.ts'

// screen = offset + grid * scale, in css pixels
export interface Viewport {
  scale: number
  offsetX: number
  offsetY: number
}

export interface ScreenSize {
  width: number
  height: number
}

export interface ScreenPoint {
  x: number
  y: number
}

const PADDING_RATIO = 0.02
const MAX_ZOOM = 6

export const fitViewport = (geometry: MapGeometry, size: ScreenSize): Viewport => {
  const usable = 1 - PADDING_RATIO * 2
  const scale = Math.min(
    (size.width * usable) / geometry.width,
    (size.height * usable) / geometry.height
  )
  return {
    scale,
    offsetX: (size.width - geometry.width * scale) / 2,
    offsetY: (size.height - geometry.height * scale) / 2,
  }
}

// keeps the map from drifting off screen. a side smaller than the screen stays centered
const clampAxis = (offset: number, mapLength: number, screenLength: number): number => {
  if (mapLength <= screenLength) return (screenLength - mapLength) / 2
  return Math.min(0, Math.max(screenLength - mapLength, offset))
}

const clampViewport = (view: Viewport, geometry: MapGeometry, size: ScreenSize): Viewport => {
  const fitted = fitViewport(geometry, size)
  const scale = Math.min(Math.max(view.scale, fitted.scale), fitted.scale * MAX_ZOOM)
  return {
    scale,
    offsetX: clampAxis(view.offsetX, geometry.width * scale, size.width),
    offsetY: clampAxis(view.offsetY, geometry.height * scale, size.height),
  }
}

interface ZoomRequest {
  geometry: MapGeometry
  size: ScreenSize
  factor: number
  // the screen point that stays put while zooming, usually the cursor
  anchor: ScreenPoint
}

export const zoomViewport = (view: Viewport, request: ZoomRequest): Viewport => {
  const { geometry, size, factor, anchor } = request
  const fitted = fitViewport(geometry, size)
  const scale = Math.min(Math.max(view.scale * factor, fitted.scale), fitted.scale * MAX_ZOOM)
  const appliedFactor = scale / view.scale
  return clampViewport(
    {
      scale,
      offsetX: anchor.x - (anchor.x - view.offsetX) * appliedFactor,
      offsetY: anchor.y - (anchor.y - view.offsetY) * appliedFactor,
    },
    geometry,
    size
  )
}

export const panViewport = (
  view: Viewport,
  delta: ScreenPoint,
  geometry: MapGeometry,
  size: ScreenSize
): Viewport =>
  clampViewport(
    { ...view, offsetX: view.offsetX + delta.x, offsetY: view.offsetY + delta.y },
    geometry,
    size
  )

export const toGridPoint = (view: Viewport, point: ScreenPoint): ScreenPoint => ({
  x: (point.x - view.offsetX) / view.scale,
  y: (point.y - view.offsetY) / view.scale,
})
