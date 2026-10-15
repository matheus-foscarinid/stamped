import { readCssTokens } from '@/styles/css-tokens'
import { getCountryBounds, isInsideBounds } from './bounds.ts'
import type { MapGeometry } from './format.ts'
import type { MapRenderer, MapScene, MarkState } from './renderer.ts'
import { fitViewport, type ScreenPoint, type ScreenRect, type Viewport } from './viewport.ts'

const BORDER_WIDTH_PX = 0.6

export interface MapPalette {
  land: string
  border: string
  visited: string
  wishlist: string
  hover: string
}

const pathCache = new WeakMap<MapGeometry, Path2D[]>()

const traceRing = (path: Path2D, ring: Int16Array): void => {
  for (let index = 0; index < ring.length; index += 2) {
    const x = ring[index] ?? 0
    const y = ring[index + 1] ?? 0
    if (index === 0) path.moveTo(x, y)
    else path.lineTo(x, y)
  }
  path.closePath()
}

const getCountryPaths = (geometry: MapGeometry): Path2D[] => {
  const cached = pathCache.get(geometry)
  if (cached) return cached
  const paths = geometry.countries.map(({ rings }) => {
    const path = new Path2D()
    for (const ring of rings) traceRing(path, ring)
    return path
  })
  pathCache.set(geometry, paths)
  return paths
}

const PALETTE_TOKENS = {
  land: '--map-land',
  border: '--map-border',
  visited: '--map-visited',
  wishlist: '--map-wishlist',
  hover: '--map-hover',
}

// colors live in css so the map follows the page theme
export const readMapPalette = (element: Element): MapPalette =>
  readCssTokens(element, PALETTE_TOKENS)

const pickBaseFill = (palette: MapPalette, mark: MarkState, isHovered: boolean): string => {
  if (mark === 'visited') return palette.visited
  if (mark === 'wishlist') return palette.wishlist
  if (isHovered) return palette.hover
  return palette.land
}

interface MarkFill {
  path: Path2D
  mark: MarkState
  isHovered: boolean
  palette: MapPalette
}

const fillMark = (
  context: CanvasRenderingContext2D,
  { path, mark, isHovered, palette }: MarkFill
) => {
  context.fillStyle = pickBaseFill(palette, mark, isHovered)
  context.fill(path, 'evenodd')
}

const fillCountry = (
  context: CanvasRenderingContext2D,
  { path, scene, index, palette }: CountryFill
) => {
  const code = scene.codes[index]
  const isHovered = index === scene.hoveredIndex
  const mark = (code && scene.marks.get(code)) || 'unmarked'
  const fade = code ? scene.fading.get(code) : undefined
  if (code && fade !== undefined) {
    const previous = scene.fadingFrom.get(code) ?? 'unmarked'
    fillMark(context, { path, mark: previous, isHovered, palette })
    context.globalAlpha = fade
  }
  fillMark(context, { path, mark, isHovered, palette })
  context.globalAlpha = 1
}

interface PaintStyle {
  palette: MapPalette
  borderWidth: number
}

interface CountryFill {
  path: Path2D
  scene: MapScene
  index: number
  palette: MapPalette
}

// the viewport must already be in target canvas pixels
const paintScene = (
  context: CanvasRenderingContext2D,
  scene: MapScene,
  { palette, borderWidth }: PaintStyle
) => {
  const { scale, offsetX, offsetY } = scene.viewport
  context.setTransform(scale, 0, 0, scale, offsetX, offsetY)
  context.lineWidth = borderWidth / scale
  context.lineJoin = 'round'
  const paths = getCountryPaths(scene.geometry)
  paths.forEach((path, index) => {
    fillCountry(context, { path, scene, index, palette })
  })
  context.strokeStyle = palette.border
  for (const path of paths) context.stroke(path)
}

const scaleViewport = ({ scale, offsetX, offsetY }: Viewport, factor: number): Viewport => ({
  scale: scale * factor,
  offsetX: offsetX * factor,
  offsetY: offsetY * factor,
})

const offsetViewport = (viewport: Viewport, { x, y }: ScreenPoint): Viewport => ({
  ...viewport,
  offsetX: viewport.offsetX + x,
  offsetY: viewport.offsetY + y,
})

const drawScene = (
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  scene: MapScene,
  pixelRatio: number
) => {
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.clearRect(0, 0, canvas.width, canvas.height)
  paintScene(
    context,
    { ...scene, viewport: scaleViewport(scene.viewport, pixelRatio) },
    { palette: readMapPalette(canvas), borderWidth: BORDER_WIDTH_PX * pixelRatio }
  )
}

type MapSnapshot = Omit<MapScene, 'hoveredIndex' | 'viewport' | 'fading' | 'fadingFrom'> &
  PaintStyle & {
    // in target canvas pixels
    rect: ScreenRect
  }

export const drawMapSnapshot = (
  context: CanvasRenderingContext2D,
  { rect, ...snapshot }: MapSnapshot
): void => {
  const viewport = offsetViewport(fitViewport(snapshot.geometry, rect), rect)
  context.save()
  const scene = {
    ...snapshot,
    fading: new Map(),
    fadingFrom: new Map(),
    hoveredIndex: null,
    viewport,
  }
  paintScene(context, scene, snapshot)
  context.restore()
}

const pickCountry = (
  context: CanvasRenderingContext2D,
  geometry: MapGeometry,
  gridPoint: ScreenPoint
): number | null => {
  const bounds = getCountryBounds(geometry)
  context.save()
  context.setTransform(1, 0, 0, 1, 0, 0)
  const isUnderPoint = (path: Path2D, index: number) => {
    const box = bounds[index]
    return (
      box !== undefined &&
      isInsideBounds(box, gridPoint) &&
      context.isPointInPath(path, gridPoint.x, gridPoint.y, 'evenodd')
    )
  }
  const index = getCountryPaths(geometry).findLastIndex(isUnderPoint)
  context.restore()
  return index === -1 ? null : index
}

export const createCanvasRenderer = (canvas: HTMLCanvasElement): MapRenderer => {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas 2d context unavailable')
  // drawing uses the density the canvas was sized for, never a newer one it hasn't caught up with
  let pixelRatio = 1
  return {
    resize: () => {
      pixelRatio = window.devicePixelRatio || 1
      canvas.width = Math.round(canvas.clientWidth * pixelRatio)
      canvas.height = Math.round(canvas.clientHeight * pixelRatio)
      return { width: canvas.clientWidth, height: canvas.clientHeight }
    },
    render: scene => drawScene(canvas, context, scene, pixelRatio),
    pick: (geometry, gridPoint) => pickCountry(context, geometry, gridPoint),
    destroy: () => undefined,
  }
}
