import type { MapGeometry } from './format.ts'
import type { MapRenderer, MapScene } from './renderer.ts'

const PADDING_RATIO = 0.02
const BORDER_WIDTH_PX = 0.6

interface Viewport {
  scale: number
  offsetX: number
  offsetY: number
}

interface Palette {
  land: string
  border: string
  visited: string
}

const pathCache = new WeakMap<MapGeometry, Path2D[]>()

const traceRing = (path: Path2D, ring: Int16Array): void => {
  path.moveTo(ring[0] ?? 0, ring[1] ?? 0)
  for (let index = 2; index < ring.length; index += 2) {
    path.lineTo(ring[index] ?? 0, ring[index + 1] ?? 0)
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

const fitViewport = (geometry: MapGeometry, width: number, height: number): Viewport => {
  const usable = 1 - PADDING_RATIO * 2
  const scale = Math.min((width * usable) / geometry.width, (height * usable) / geometry.height)
  return {
    scale,
    offsetX: (width - geometry.width * scale) / 2,
    offsetY: (height - geometry.height * scale) / 2,
  }
}

// colors live in css so the map follows the page theme
const readPalette = (canvas: HTMLCanvasElement): Palette => {
  const style = getComputedStyle(canvas)
  return {
    land: style.getPropertyValue('--map-land').trim(),
    border: style.getPropertyValue('--map-border').trim(),
    visited: style.getPropertyValue('--map-visited').trim(),
  }
}

const paintScene = (context: CanvasRenderingContext2D, scene: MapScene, palette: Palette) => {
  const paths = getCountryPaths(scene.geometry)
  paths.forEach((path, index) => {
    const code = scene.codes[index]
    context.fillStyle = code && scene.visited.has(code) ? palette.visited : palette.land
    context.fill(path, 'evenodd')
  })
  context.strokeStyle = palette.border
  for (const path of paths) context.stroke(path)
}

const drawScene = (
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  scene: MapScene
) => {
  const pixelRatio = window.devicePixelRatio || 1
  const { scale, offsetX, offsetY } = fitViewport(
    scene.geometry,
    canvas.clientWidth,
    canvas.clientHeight
  )
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.setTransform(
    pixelRatio * scale,
    0,
    0,
    pixelRatio * scale,
    pixelRatio * offsetX,
    pixelRatio * offsetY
  )
  context.lineWidth = BORDER_WIDTH_PX / scale
  context.lineJoin = 'round'
  paintScene(context, scene, readPalette(canvas))
}

const matchBackingStore = (canvas: HTMLCanvasElement): void => {
  const pixelRatio = window.devicePixelRatio || 1
  canvas.width = Math.round(canvas.clientWidth * pixelRatio)
  canvas.height = Math.round(canvas.clientHeight * pixelRatio)
}

export const createCanvasRenderer = (canvas: HTMLCanvasElement): MapRenderer => {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas 2d context unavailable')
  let lastScene: MapScene | null = null
  const observer = new ResizeObserver(() => {
    matchBackingStore(canvas)
    if (lastScene) drawScene(canvas, context, lastScene)
  })
  observer.observe(canvas)
  matchBackingStore(canvas)
  return {
    render: scene => {
      lastScene = scene
      drawScene(canvas, context, scene)
    },
    destroy: () => observer.disconnect(),
  }
}
