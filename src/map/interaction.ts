import type { ScreenPoint } from './viewport.ts'

export interface InteractionHandlers {
  onZoom: (factor: number, anchor: ScreenPoint) => void
  onPan: (delta: ScreenPoint) => void
  onTap: (point: ScreenPoint) => void
  onHover: (point: ScreenPoint | null) => void
}

// a press that moved less than this still counts as a tap, not a drag
const TAP_TOLERANCE_PX = 5
const WHEEL_ZOOM_SPEED = 0.002

interface GestureState {
  pointers: Map<number, ScreenPoint>
  travel: number
}

const distanceBetween = (a: ScreenPoint, b: ScreenPoint): number => Math.hypot(a.x - b.x, a.y - b.y)

const findOtherPointer = (state: GestureState, pointerId: number): ScreenPoint | undefined =>
  [...state.pointers].find(([id]) => id !== pointerId)?.[1]

const handlePinch = (
  state: GestureState,
  pointerId: number,
  point: ScreenPoint,
  handlers: InteractionHandlers
) => {
  const previous = state.pointers.get(pointerId)
  const other = findOtherPointer(state, pointerId)
  if (!previous || !other) return
  const factor = distanceBetween(point, other) / Math.max(distanceBetween(previous, other), 1)
  state.travel = Number.POSITIVE_INFINITY
  handlers.onZoom(factor, { x: (point.x + other.x) / 2, y: (point.y + other.y) / 2 })
}

const handleDrag = (
  state: GestureState,
  previous: ScreenPoint,
  point: ScreenPoint,
  handlers: InteractionHandlers
) => {
  state.travel += distanceBetween(previous, point)
  handlers.onPan({ x: point.x - previous.x, y: point.y - previous.y })
}

const createPointerMove =
  (
    state: GestureState,
    toLocal: (event: PointerEvent) => ScreenPoint,
    handlers: InteractionHandlers
  ) =>
  (event: PointerEvent) => {
    const point = toLocal(event)
    const previous = state.pointers.get(event.pointerId)
    if (!previous) return handlers.onHover(point)
    if (state.pointers.size > 1) handlePinch(state, event.pointerId, point, handlers)
    else handleDrag(state, previous, point, handlers)
    state.pointers.set(event.pointerId, point)
  }

const createLocalPoint =
  (canvas: HTMLCanvasElement) =>
  (event: PointerEvent | WheelEvent): ScreenPoint => {
    const rect = canvas.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

export const attachInteraction = (
  canvas: HTMLCanvasElement,
  handlers: InteractionHandlers
): (() => void) => {
  const state: GestureState = { pointers: new Map(), travel: 0 }
  const toLocal = createLocalPoint(canvas)
  const controller = new AbortController()
  const { signal } = controller

  canvas.addEventListener(
    'wheel',
    event => {
      event.preventDefault()
      handlers.onZoom(Math.exp(-event.deltaY * WHEEL_ZOOM_SPEED), toLocal(event))
    },
    { passive: false, signal }
  )
  canvas.addEventListener(
    'pointerdown',
    event => {
      canvas.setPointerCapture(event.pointerId)
      state.pointers.set(event.pointerId, toLocal(event))
      state.travel = state.pointers.size > 1 ? Number.POSITIVE_INFINITY : 0
    },
    { signal }
  )
  canvas.addEventListener('pointermove', createPointerMove(state, toLocal, handlers), { signal })
  canvas.addEventListener(
    'pointerup',
    event => {
      const isTap = state.pointers.size === 1 && state.travel < TAP_TOLERANCE_PX
      if (isTap) handlers.onTap(toLocal(event))
      state.pointers.delete(event.pointerId)
    },
    { signal }
  )
  canvas.addEventListener('pointercancel', event => state.pointers.delete(event.pointerId), {
    signal,
  })
  canvas.addEventListener(
    'pointerleave',
    () => {
      if (state.pointers.size === 0) handlers.onHover(null)
    },
    { signal }
  )
  return () => controller.abort()
}
