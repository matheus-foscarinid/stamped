import { readCssTokens } from '@/styles/css-tokens'
import type { MapGeometry } from './format.ts'
import type { MapRenderer, MapScene, MarkState } from './renderer.ts'
import { fitViewport, type ScreenPoint, type ScreenRect, type Viewport } from './viewport.ts'

const BORDER_WIDTH_PX = 0.6
// stripes scale with the border, so exports drawn with thicker borders get wider stripes too
const HATCH = { spacing: 10, width: 2.6 }

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

const pickBaseFill = (palette: MapPalette, mark: MarkState, isHovered: boolean): string => {
  if (mark === 'visited') return palette.visited
  if (isHovered) return palette.hover
  return palette.land
}

interface MarkFill {
  path: Path2D
  mark: MarkState
  isHovered: boolean
  inks: Inks
}

const fillMark = (context: CanvasRenderingContext2D, { path, mark, isHovered, inks }: MarkFill) => {
  context.fillStyle = pickBaseFill(inks.palette, mark, isHovered)
  context.fill(path, 'evenodd')
  if (mark !== 'wishlist' || !inks.hatch) return
  context.fillStyle = inks.hatch
  context.fill(path, 'evenodd')
}

const fillCountry = (
  context: CanvasRenderingContext2D,
  { path, scene, index, inks }: CountryFill
) => {
  const code = scene.codes[index]
  const isHovered = index === scene.hoveredIndex
  const mark = (code && scene.marks.get(code)) || 'unmarked'
  const fade = code ? scene.fading.get(code) : undefined
  if (code && fade !== undefined) {
    const previous = scene.fadingFrom.get(code) ?? 'unmarked'
    fillMark(context, { path, mark: previous, isHovered, inks })
    context.globalAlpha = fade
  }
  fillMark(context, { path, mark, isHovered, inks })
  context.globalAlpha = 1
}

// one tile of diagonal stripes, with the corner pieces so tiles join seamlessly
const drawHatchTile = (color: string, borderWidth: number): HTMLCanvasElement => {
  const tile = document.createElement('canvas')
  const size = Math.max(2, Math.round(HATCH.spacing * borderWidth))
  tile.width = size
  tile.height = size
  const context = tile.getContext('2d')
  if (!context) return tile
  context.strokeStyle = color
  context.lineWidth = HATCH.width * borderWidth
  context.beginPath()
  for (const shift of [-size, 0, size]) {
    context.moveTo(shift, size)
    context.lineTo(shift + size, 0)
  }
  context.stroke()
  return tile
}

let hatchCache: { key: string; pattern: CanvasPattern | null } | null = null

const getHatch = (
  context: CanvasRenderingContext2D,
  color: string,
  borderWidth: number
): CanvasPattern | null => {
  const key = `${color} ${borderWidth}`
  if (hatchCache?.key !== key) {
    hatchCache = {
      key,
      pattern: context.createPattern(drawHatchTile(color, borderWidth), 'repeat'),
    }
  }
  return hatchCache.pattern
}

interface Inks {
  palette: MapPalette
  hatch: CanvasPattern | null
}

interface PaintStyle {
  palette: MapPalette
  borderWidth: number
}

interface CountryFill {
  path: Path2D
  scene: MapScene
  index: number
  inks: Inks
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
  const hatch = getHatch(context, palette.visited, borderWidth)
  // the map transform would scale the stripes with the zoom, this keeps them a fixed width
  hatch?.setTransform(new DOMMatrix().scale(1 / scale))
  const inks = { palette, hatch }
  const paths = getCountryPaths(scene.geometry)
  paths.forEach(({ path }, index) => {
    fillCountry(context, { path, scene, index, inks })
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
