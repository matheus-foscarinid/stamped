import { readCssTokens } from '@/styles/css-tokens'
import { createCanvasRenderer, drawMapSnapshot, readMapPalette } from './canvas-renderer.ts'
import { createFadeAnimator, type FadeAnimator } from './fades.ts'
import { attachInteraction } from './interaction.ts'
import { loadCountryCodes, loadGeometry } from './load.ts'
import { watchPixelRatio } from './pixel-ratio.ts'
import type { ProjectionId } from './projections.ts'
import type { MapRenderer, MapScene } from './renderer.ts'
import {
  homeViewport,
  panViewport,
  type ScreenPoint,
  type ScreenRect,
  type ScreenSize,
  toGridPoint,
  zoomViewport,
} from './viewport.ts'

export { watchPixelRatio } from './pixel-ratio.ts'
export { DEFAULT_PROJECTION, type ProjectionId } from './projections.ts'
export type { ScreenRect } from './viewport.ts'

export interface WorldMapOptions {
  projection: ProjectionId
  // defaults to the canvas renderer. pass one to try another way of drawing
  renderer?: MapRenderer
  // codes outside this check are drawn but ignore hover and clicks
  isSelectable?: (code: string) => boolean
  onCountryClick?: (code: string) => void
  onCountryHover?: (code: string | null) => void
}

export interface WorldMap {
  setProjection: (projection: ProjectionId) => Promise<void>
  setVisited: (codes: Iterable<string>) => void
  zoomBy: (factor: number) => void
  resetZoom: () => void
  destroy: () => void
}

interface MapController {
  canvas: HTMLCanvasElement
  scene: MapScene
  size: ScreenSize
  renderer: MapRenderer
  options: WorldMapOptions
  fades: FadeAnimator
  scheduleRender: () => void
}

const FRAME_TOKENS = {
  paddingX: '--map-padding-x',
  paddingY: '--map-padding-y',
  startZoom: '--map-start-zoom',
}

interface MapFrame {
  size: ScreenSize
  startZoom: number
}

const parseCssNumber = (value: string, fallback: number): number => {
  const number = Number.parseFloat(value)
  return Number.isFinite(number) ? number : fallback
}

// overlays float over the map and phones need a closer start, so css sets both per layout
const measureFrame = (canvas: HTMLCanvasElement, renderer: MapRenderer): MapFrame => {
  const tokens = readCssTokens(canvas, FRAME_TOKENS)
  const padding = { x: parseCssNumber(tokens.paddingX, 0), y: parseCssNumber(tokens.paddingY, 0) }
  return { size: { ...renderer.resize(), padding }, startZoom: parseCssNumber(tokens.startZoom, 1) }
}

const createRenderScheduler = (render: () => void): (() => void) => {
  let isScheduled = false
  return () => {
    if (isScheduled) return
    isScheduled = true
    requestAnimationFrame(() => {
      isScheduled = false
      render()
    })
  }
}

const findSelectableIndex = (controller: MapController, point: ScreenPoint): number | null => {
  const { scene, renderer, options } = controller
  const index = renderer.pick(scene.geometry, toGridPoint(scene.viewport, point))
  if (index === null) return null
  const code = scene.codes[index]
  const isSelectable = options.isSelectable ?? (() => true)
  return code && isSelectable(code) ? index : null
}

const updateHover = (
  controller: MapController,
  canvas: HTMLCanvasElement,
  point: ScreenPoint | null
) => {
  const index = point && findSelectableIndex(controller, point)
  if (index === controller.scene.hoveredIndex) return
  controller.scene.hoveredIndex = index
  canvas.style.cursor = index === null ? '' : 'pointer'
  controller.options.onCountryHover?.(
    index === null ? null : (controller.scene.codes[index] ?? null)
  )
  controller.scheduleRender()
}

const handleTap = (controller: MapController, point: ScreenPoint) => {
  const index = findSelectableIndex(controller, point)
  const code = index === null ? null : controller.scene.codes[index]
  if (code) controller.options.onCountryClick?.(code)
}

const zoomAround = (controller: MapController, factor: number, anchor: ScreenPoint) => {
  const { scene, size } = controller
  scene.viewport = zoomViewport(scene.viewport, { geometry: scene.geometry, size, factor, anchor })
  controller.scheduleRender()
}

const panBy = (controller: MapController, delta: ScreenPoint) => {
  const { scene, size } = controller
  scene.viewport = panViewport(scene.viewport, delta, scene.geometry, size)
  controller.scheduleRender()
}

const refit = (controller: MapController) => {
  const { size, startZoom } = measureFrame(controller.canvas, controller.renderer)
  controller.size = size
  controller.scene.viewport = homeViewport(controller.scene.geometry, size, startZoom)
  controller.renderer.render(controller.scene)
}

const createController = async (
  canvas: HTMLCanvasElement,
  options: WorldMapOptions
): Promise<MapController> => {
  const renderer = options.renderer ?? createCanvasRenderer(canvas)
  const [geometry, codes] = await Promise.all([
    loadGeometry(options.projection),
    loadCountryCodes(),
  ])
  const { size, startZoom } = measureFrame(canvas, renderer)
  const scene: MapScene = {
    geometry,
    codes,
    visited: new Set(),
    fading: new Map(),
    hoveredIndex: null,
    viewport: homeViewport(geometry, size, startZoom),
  }
  const scheduleRender = createRenderScheduler(() => renderer.render(scene))
  const fades = createFadeAnimator(fading => {
    scene.fading = fading
    scheduleRender()
  })
  return { canvas, scene, size, renderer, options, fades, scheduleRender }
}

const setVisited = (controller: MapController, codes: Iterable<string>) => {
  const previous = controller.scene.visited
  const next = new Set(codes)
  const added = [...next].filter(code => !previous.has(code))
  const removed = [...previous].filter(code => !next.has(code))
  controller.scene.visited = next
  controller.fades.start([...added, ...removed])
  controller.scheduleRender()
}

const createProjectionSetter = (controller: MapController) => {
  let latestRequest = 0
  return async (projection: ProjectionId) => {
    latestRequest += 1
    const request = latestRequest
    const geometry = await loadGeometry(projection)
    // a quicker toggle may have landed while this file was loading
    if (request !== latestRequest) return
    controller.scene.geometry = geometry
    controller.scene.hoveredIndex = null
    refit(controller)
  }
}

export const createWorldMap = async (
  canvas: HTMLCanvasElement,
  options: WorldMapOptions
): Promise<WorldMap> => {
  const controller = await createController(canvas, options)
  const detachInteraction = attachInteraction(canvas, {
    onZoom: (factor, anchor) => zoomAround(controller, factor, anchor),
    onPan: delta => panBy(controller, delta),
    onTap: point => handleTap(controller, point),
    onHover: point => updateHover(controller, canvas, point),
  })
  const resizeObserver = new ResizeObserver(() => refit(controller))
  resizeObserver.observe(canvas)
  const stopWatchingPixelRatio = watchPixelRatio(() => refit(controller))
  // colors come from css, so a theme switch on the page needs a fresh frame
  const themeObserver = new MutationObserver(controller.scheduleRender)
  themeObserver.observe(document.documentElement, { attributes: true })

  return {
    setProjection: createProjectionSetter(controller),
    setVisited: codes => setVisited(controller, codes),
    zoomBy: factor => {
      const { width, height } = controller.size
      zoomAround(controller, factor, { x: width / 2, y: height / 2 })
    },
    resetZoom: () => refit(controller),
    destroy: () => {
      detachInteraction()
      resizeObserver.disconnect()
      stopWatchingPixelRatio()
      controller.fades.stop()
      themeObserver.disconnect()
      controller.renderer.destroy()
    },
  }
}

export interface WorldSnapshotOptions {
  projection: ProjectionId
  visited: Iterable<string>
  rect: ScreenRect
  borderWidth: number
}

// always drawn with canvas, whatever renderer the live map uses
export const drawWorldSnapshot = async (
  context: CanvasRenderingContext2D,
  options: WorldSnapshotOptions
): Promise<void> => {
  const [geometry, codes] = await Promise.all([
    loadGeometry(options.projection),
    loadCountryCodes(),
  ])
  drawMapSnapshot(context, {
    geometry,
    codes,
    visited: new Set(options.visited),
    palette: readMapPalette(document.documentElement),
    rect: options.rect,
    borderWidth: options.borderWidth,
  })
}
