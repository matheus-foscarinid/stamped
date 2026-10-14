import { readCssTokens } from '@/styles/css-tokens'
import type { MapGeometry } from './format.ts'
import type { MapRenderer, MapScene } from './renderer.ts'
import { fitViewport, type ScreenPoint, type ScreenRect, type Viewport } from './viewport.ts'

const BORDER_WIDTH_PX = 0.6

interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

interface CountryPath {
  path: Path2D
  bounds: Bounds
}

export interface MapPalette {
  land: string
  border: string
  visited: string
  hover: string
}

const pathCache = new WeakMap<MapGeometry, CountryPath[]>()

const traceRing = (path: Path2D, bounds: Bounds, ring: Int16Array): void => {
  for (let index = 0; index < ring.length; index += 2) {
    const x = ring[index] ?? 0
    const y = ring[index + 1] ?? 0
    if (index === 0) path.moveTo(x, y)
    else path.lineTo(x, y)
    bounds.minX = Math.min(bounds.minX, x)
    bounds.minY = Math.min(bounds.minY, y)
    bounds.maxX = Math.max(bounds.maxX, x)
    bounds.maxY = Math.max(bounds.maxY, y)
  }
  path.closePath()
}

const getCountryPaths = (geometry: MapGeometry): CountryPath[] => {
  const cached = pathCache.get(geometry)
  if (cached) return cached
  const paths = geometry.countries.map(({ rings }) => {
    const path = new Path2D()
    const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    for (const ring of rings) traceRing(path, bounds, ring)
    return { path, bounds }
  })
  pathCache.set(geometry, paths)
  return paths
}

const isInsideBounds = ({ minX, minY, maxX, maxY }: Bounds, { x, y }: ScreenPoint): boolean =>
  x >= minX && x <= maxX && y >= minY && y <= maxY

const PALETTE_TOKENS = {
  land: '--map-land',
  border: '--map-border',
  visited: '--map-visited',
  hover: '--map-hover',
}

// colors live in css so the map follows the page theme
export const readMapPalette = (element: Element): MapPalette =>
  readCssTokens(element, PALETTE_TOKENS)

const pickFill = (palette: MapPalette, isVisited: boolean, isHovered: boolean): string => {
  if (isVisited) return palette.visited
  if (isHovered) return palette.hover
  return palette.land
}

const fillCountry = (
  context: CanvasRenderingContext2D,
  { path, scene, index, palette }: CountryFill
) => {
  const code = scene.codes[index]
  const isVisited = code ? scene.visited.has(code) : false
  const isHovered = index === scene.hoveredIndex
  const fade = code ? scene.fading.get(code) : undefined
  if (fade !== undefined) {
    context.fillStyle = pickFill(palette, !isVisited, isHovered)
    context.fill(path, 'evenodd')
    context.globalAlpha = fade
  }
  context.fillStyle = pickFill(palette, isVisited, isHovered)
  context.fill(path, 'evenodd')
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
  paths.forEach(({ path }, index) => {
    fillCountry(context, { path, scene, index, palette })
  })
  context.strokeStyle = palette.border
  for (const { path } of paths) context.stroke(path)
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
  scene: MapScene
) => {
  const pixelRatio = window.devicePixelRatio || 1
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.clearRect(0, 0, canvas.width, canvas.height)
  paintScene(
    context,
    { ...scene, viewport: scaleViewport(scene.viewport, pixelRatio) },
    { palette: readMapPalette(canvas), borderWidth: BORDER_WIDTH_PX * pixelRatio }
  )
}

type MapSnapshot = Omit<MapScene, 'hoveredIndex' | 'viewport' | 'fading'> &
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
  paintScene(context, { ...snapshot, fading: new Map(), hoveredIndex: null, viewport }, snapshot)
  context.restore()
}

const pickCountry = (
  context: CanvasRenderingContext2D,
  geometry: MapGeometry,
  gridPoint: ScreenPoint
): number | null => {
  context.save()
  context.setTransform(1, 0, 0, 1, 0, 0)
  const paths = getCountryPaths(geometry)
  const index = paths.findIndex(
    ({ path, bounds }) =>
      isInsideBounds(bounds, gridPoint) &&
      context.isPointInPath(path, gridPoint.x, gridPoint.y, 'evenodd')
  )
  context.restore()
  return index === -1 ? null : index
}

export const createCanvasRenderer = (canvas: HTMLCanvasElement): MapRenderer => {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas 2d context unavailable')
  return {
    resize: () => {
      const pixelRatio = window.devicePixelRatio || 1
      canvas.width = Math.round(canvas.clientWidth * pixelRatio)
      canvas.height = Math.round(canvas.clientHeight * pixelRatio)
      return { width: canvas.clientWidth, height: canvas.clientHeight }
    },
    render: scene => drawScene(canvas, context, scene),
    pick: (geometry, gridPoint) => pickCountry(context, geometry, gridPoint),
    destroy: () => undefined,
  }
}
