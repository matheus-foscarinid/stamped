import { readCssTokens } from '@/styles/css-tokens'
import { getCountryBounds, pickWithinReach } from './bounds.ts'
import { createCanvasRenderer, drawMapSnapshot, readMapPalette } from './canvas-renderer.ts'
import { createFadeAnimator, type FadeAnimator } from './fades.ts'
import { attachInteraction } from './interaction.ts'
import { loadCountryCodes, loadGeometry } from './load.ts'
import { type CountryMarks, changeMarks, toMarkStates } from './marks.ts'
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
import { createZoomAnimator } from './zoom-animator.ts'

// a miss this close to a tiny country still picks it, since its shape is too small to tap
const TINY_COUNTRY_REACH_PX = 8
// long enough to read the name a finger just lifted from
const PEEK_LINGER_MS = 1400

export type { CountryMarks } from './marks.ts'
export { watchPixelRatio } from './pixel-ratio.ts'
export { DEFAULT_PROJECTION, MAP_ASPECT, type ProjectionId } from './projections.ts'
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
  setMarks: (marks: CountryMarks) => void
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

const isSelectableIndex = ({ scene, options }: MapController, index: number): boolean => {
  const code = scene.codes[index]
  const isSelectable = options.isSelectable ?? (() => true)
  return Boolean(code && isSelectable(code))
}

const findSelectableIndex = (controller: MapController, point: ScreenPoint): number | null => {
  const { scene, renderer } = controller
  const gridPoint = toGridPoint(scene.viewport, point)
  return pickWithinReach(getCountryBounds(scene.geometry), {
    hit: renderer.pick(scene.geometry, gridPoint),
    point: gridPoint,
    reach: TINY_COUNTRY_REACH_PX / scene.viewport.scale,
    isCandidate: index => isSelectableIndex(controller, index),
  })
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

// a lifted finger leaves its country named for a moment, a mouse moving on clears it at once
const createPeek = (controller: MapController, canvas: HTMLCanvasElement) => {
  let lingerTimer: ReturnType<typeof setTimeout> | undefined
  const stopLingering = () => clearTimeout(lingerTimer)
  const peek = (point: ScreenPoint | null) => {
    stopLingering()
    if (point) return updateHover(controller, canvas, point)
    lingerTimer = setTimeout(() => updateHover(controller, canvas, null), PEEK_LINGER_MS)
  }
  const hover = (point: ScreenPoint | null) => {
    stopLingering()
    updateHover(controller, canvas, point)
  }
  return { peek, hover, stopLingering }
}

const handleTap = (controller: MapController, point: ScreenPoint) => {
  const index = findSelectableIndex(controller, point)
  const code = index === null ? null : controller.scene.codes[index]
  if (code) controller.options.onCountryClick?.(code)
}

const zoomAround = (controller: MapController, factor: number, anchor: ScreenPoint): number => {
  const { scene, size } = controller
  const previousScale = scene.viewport.scale
  scene.viewport = zoomViewport(scene.viewport, { geometry: scene.geometry, size, factor, anchor })
  controller.scheduleRender()
  return scene.viewport.scale / previousScale
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
    marks: new Map(),
    fading: new Map(),
    fadingFrom: new Map(),
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

const setMarks = (controller: MapController, next: CountryMarks) => {
  const { scene } = controller
  const settledFrom = [...scene.fadingFrom].filter(([code]) => scene.fading.has(code))
  const change = changeMarks({ previous: scene.marks, next, fading: new Map(settledFrom) })
  scene.marks = change.marks
  scene.fadingFrom = change.fadingFrom
  controller.fades.start(change.changed)
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
  const pointing = createPeek(controller, canvas)
  const zoomGlide = createZoomAnimator((factor, anchor) => zoomAround(controller, factor, anchor))
  // a touch, a reset or a new projection cancels the glide
  const takeOver =
    <Args extends unknown[], Result>(action: (...args: Args) => Result) =>
    (...args: Args): Result => {
      zoomGlide.stop()
      return action(...args)
    }
  const detachInteraction = attachInteraction(canvas, {
    onZoom: takeOver((factor, anchor) => zoomAround(controller, factor, anchor)),
    onEasedZoom: zoomGlide.zoomBy,
    onPan: takeOver(delta => panBy(controller, delta)),
    onTap: point => handleTap(controller, point),
    onHover: pointing.hover,
    onPeek: pointing.peek,
  })
  const resizeObserver = new ResizeObserver(() => refit(controller))
  resizeObserver.observe(canvas)
  const stopWatchingPixelRatio = watchPixelRatio(() => refit(controller))
  // colors come from css, so a theme switch on the page needs a fresh frame
  const themeObserver = new MutationObserver(controller.scheduleRender)
  themeObserver.observe(document.documentElement, { attributes: true })

  return {
    setProjection: takeOver(createProjectionSetter(controller)),
    setMarks: marks => setMarks(controller, marks),
    zoomBy: factor => {
      const { width, height } = controller.size
      zoomGlide.zoomBy(factor, { x: width / 2, y: height / 2 })
    },
    resetZoom: takeOver(() => refit(controller)),
    destroy: takeOver(() => {
      detachInteraction()
      pointing.stopLingering()
      resizeObserver.disconnect()
      stopWatchingPixelRatio()
      controller.fades.stop()
      themeObserver.disconnect()
      controller.renderer.destroy()
    }),
  }
}

export interface WorldSnapshotOptions {
  projection: ProjectionId
  visited: Iterable<string>
  wishlist?: Iterable<string>
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
    marks: toMarkStates({ visited: options.visited, wishlist: options.wishlist ?? [] }),
    palette: readMapPalette(document.documentElement),
    rect: options.rect,
    borderWidth: options.borderWidth,
  })
}
