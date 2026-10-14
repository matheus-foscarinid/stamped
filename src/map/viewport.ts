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
  // room kept clear around the fitted map, per side, so overlays don't cover it
  padding?: ScreenPoint
}

export interface ScreenPoint {
  x: number
  y: number
}

export interface ScreenRect extends ScreenSize, ScreenPoint {}

const PADDING_RATIO = 0.02
const MAX_ZOOM = 6

const NO_PADDING: ScreenPoint = { x: 0, y: 0 }

export const fitViewport = (geometry: MapGeometry, size: ScreenSize): Viewport => {
  const usable = 1 - PADDING_RATIO * 2
  const { x, y } = size.padding ?? NO_PADDING
  const scale = Math.min(
    ((size.width - x * 2) * usable) / geometry.width,
    ((size.height - y * 2) * usable) / geometry.height
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

// the resting view. tall screens start zoomed in so the world isn't a thin strip
export const homeViewport = (
  geometry: MapGeometry,
  size: ScreenSize,
  startZoom: number
): Viewport =>
  zoomViewport(fitViewport(geometry, size), {
    geometry,
    size,
    factor: startZoom,
    anchor: { x: size.width / 2, y: size.height / 2 },
  })

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
