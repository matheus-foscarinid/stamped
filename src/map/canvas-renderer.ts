import type { MapGeometry } from './format.ts'
import type { MapRenderer, MapScene } from './renderer.ts'
import { fitViewport, type ScreenPoint, type ScreenRect } from './viewport.ts'

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

// colors live in css so the map follows the page theme
export const readMapPalette = (element: Element): MapPalette => {
  const style = getComputedStyle(element)
  const read = (name: string) => style.getPropertyValue(name).trim()
  return {
    land: read('--map-land'),
    border: read('--map-border'),
    visited: read('--map-visited'),
    hover: read('--map-hover'),
  }
}

const pickFill = (scene: MapScene, index: number, palette: MapPalette): string => {
  const code = scene.codes[index]
  if (code && scene.visited.has(code)) return palette.visited
  if (index === scene.hoveredIndex) return palette.hover
  return palette.land
}

const paintScene = (context: CanvasRenderingContext2D, scene: MapScene, palette: MapPalette) => {
  const paths = getCountryPaths(scene.geometry)
  paths.forEach(({ path }, index) => {
    context.fillStyle = pickFill(scene, index, palette)
    context.fill(path, 'evenodd')
  })
  context.strokeStyle = palette.border
  for (const { path } of paths) context.stroke(path)
}

// viewport in output pixels: whatever the target, grid units become pixels the same way
const paintWithViewport = (
  context: CanvasRenderingContext2D,
  scene: MapScene,
  palette: MapPalette,
  borderWidth: number
) => {
  const { scale, offsetX, offsetY } = scene.viewport
  context.setTransform(scale, 0, 0, scale, offsetX, offsetY)
  context.lineWidth = borderWidth / scale
  context.lineJoin = 'round'
  paintScene(context, scene, palette)
}

const drawScene = (
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  scene: MapScene
) => {
  const pixelRatio = window.devicePixelRatio || 1
  const { scale, offsetX, offsetY } = scene.viewport
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.clearRect(0, 0, canvas.width, canvas.height)
  const deviceViewport = {
    scale: scale * pixelRatio,
    offsetX: offsetX * pixelRatio,
    offsetY: offsetY * pixelRatio,
  }
  paintWithViewport(
    context,
    { ...scene, viewport: deviceViewport },
    readMapPalette(canvas),
    BORDER_WIDTH_PX * pixelRatio
  )
}

export interface MapSnapshot {
  geometry: MapGeometry
  codes: (string | null)[]
  visited: ReadonlySet<string>
  palette: MapPalette
  // where the map goes on the target canvas, in its pixels
  rect: ScreenRect
  borderWidth: number
}

// draws the whole world fitted into a rect, for images that leave the app
export const drawMapSnapshot = (context: CanvasRenderingContext2D, snapshot: MapSnapshot): void => {
  const { geometry, rect } = snapshot
  const fitted = fitViewport(geometry, rect)
  const viewport = {
    scale: fitted.scale,
    offsetX: rect.x + fitted.offsetX,
    offsetY: rect.y + fitted.offsetY,
  }
  context.save()
  paintWithViewport(
    context,
    { geometry, codes: snapshot.codes, visited: snapshot.visited, hoveredIndex: null, viewport },
    snapshot.palette,
    snapshot.borderWidth
  )
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
