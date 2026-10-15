import type { ScreenPoint } from './viewport.ts'

export interface InteractionHandlers {
  onZoom: (factor: number, anchor: ScreenPoint) => void
  onEasedZoom: (factor: number, anchor: ScreenPoint) => void
  onPan: (delta: ScreenPoint) => void
  onTap: (point: ScreenPoint) => void
  onHover: (point: ScreenPoint | null) => void
  // touch has no hover, so a finger shows what's under it. null once it lifts
  onPeek: (point: ScreenPoint | null) => void
}

// a press that moved less than this still counts as a tap, not a drag
const TAP_TOLERANCE_PX = 5
// a finger held this long without moving reads names instead of dragging the map
const PEEK_DELAY_MS = 300
const PEEK_BUZZ_MS = 8
const WHEEL_ZOOM_SPEED = 0.002
// a trackpad pinch arrives as small wheel steps with ctrl held, so it needs a faster rate
const TRACKPAD_PINCH_SPEED = 0.01
// ctrl with a mouse wheel zooms too, but its notches are far bigger than a pinch step
const TRACKPAD_PINCH_MAX_DELTA_PX = 40
// wheel deltas may be in lines or pages
const PX_PER_DELTA_MODE: Record<number, number> = { 0: 1, 1: 16, 2: 800 }

interface GestureState {
  pointers: Map<number, ScreenPoint>
  travel: number
  isPeeking: boolean
  peekTimer: ReturnType<typeof setTimeout> | undefined
}

const cancelPeekTimer = (state: GestureState) => {
  clearTimeout(state.peekTimer)
  state.peekTimer = undefined
}

const startPeekTimer = (state: GestureState, handlers: InteractionHandlers) => {
  cancelPeekTimer(state)
  state.peekTimer = setTimeout(() => {
    const [point] = [...state.pointers.values()]
    if (state.pointers.size !== 1 || state.travel >= TAP_TOLERANCE_PX || !point) return
    state.isPeeking = true
    navigator.vibrate?.(PEEK_BUZZ_MS)
    handlers.onPeek(point)
  }, PEEK_DELAY_MS)
}

const distanceBetween = (a: ScreenPoint, b: ScreenPoint): number => Math.hypot(a.x - b.x, a.y - b.y)

const findOtherPointer = (state: GestureState, pointerId: number): ScreenPoint | undefined =>
  [...state.pointers].find(([id]) => id !== pointerId)?.[1]

const midpointOf = (a: ScreenPoint, b: ScreenPoint): ScreenPoint => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
})

// keeps the spot between the fingers under them
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
  const before = midpointOf(previous, other)
  const after = midpointOf(point, other)
  state.travel = Number.POSITIVE_INFINITY
  handlers.onZoom(factor, before)
  handlers.onPan({ x: after.x - before.x, y: after.y - before.y })
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
    if (state.isPeeking) handlers.onPeek(point)
    else if (state.pointers.size > 1) handlePinch(state, event.pointerId, point, handlers)
    else handleDrag(state, previous, point, handlers)
    state.pointers.set(event.pointerId, point)
  }

const handleWheel = (
  event: WheelEvent,
  toLocal: (event: WheelEvent) => ScreenPoint,
  handlers: InteractionHandlers
) => {
  event.preventDefault()
  const delta = event.deltaY * (PX_PER_DELTA_MODE[event.deltaMode] ?? 1)
  const isTrackpadPinch = event.ctrlKey && Math.abs(delta) < TRACKPAD_PINCH_MAX_DELTA_PX
  if (isTrackpadPinch) handlers.onZoom(Math.exp(-delta * TRACKPAD_PINCH_SPEED), toLocal(event))
  else handlers.onEasedZoom(Math.exp(-delta * WHEEL_ZOOM_SPEED), toLocal(event))
}

const isFinger = (event: PointerEvent) => event.pointerType !== 'mouse'

const createPointerDown =
  (
    canvas: HTMLCanvasElement,
    state: GestureState,
    toLocal: (event: PointerEvent) => ScreenPoint,
    handlers: InteractionHandlers
  ) =>
  (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    canvas.setPointerCapture(event.pointerId)
    state.pointers.set(event.pointerId, toLocal(event))
    state.travel = state.pointers.size > 1 ? Number.POSITIVE_INFINITY : 0
    if (isFinger(event) && state.pointers.size === 1) return startPeekTimer(state, handlers)
    cancelPeekTimer(state)
    // a second finger means a pinch, so the names step aside
    if (state.isPeeking) handlers.onPeek(null)
    state.isPeeking = false
  }

// a quick tap peeks too, so the finger learns which country it just stamped
const createPointerUp =
  (
    state: GestureState,
    toLocal: (event: PointerEvent) => ScreenPoint,
    handlers: InteractionHandlers
  ) =>
  (event: PointerEvent) => {
    const point = toLocal(event)
    const isTap = state.pointers.size === 1 && state.travel < TAP_TOLERANCE_PX
    cancelPeekTimer(state)
    const wasPeeking = state.isPeeking
    state.isPeeking = false
    state.pointers.delete(event.pointerId)
    if (wasPeeking) return handlers.onPeek(null)
    if (!isTap) return
    handlers.onTap(point)
    if (!isFinger(event)) return
    handlers.onPeek(point)
    handlers.onPeek(null)
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
  const state: GestureState = {
    pointers: new Map(),
    travel: 0,
    isPeeking: false,
    peekTimer: undefined,
  }
  const toLocal = createLocalPoint(canvas)
  const controller = new AbortController()
  const { signal } = controller

  canvas.addEventListener('wheel', event => handleWheel(event, toLocal, handlers), {
    passive: false,
    signal,
  })
  canvas.addEventListener('pointerdown', createPointerDown(canvas, state, toLocal, handlers), {
    signal,
  })
  canvas.addEventListener('pointermove', createPointerMove(state, toLocal, handlers), { signal })
  canvas.addEventListener('pointerup', createPointerUp(state, toLocal, handlers), { signal })
  const forgetPointer = (event: PointerEvent) => {
    cancelPeekTimer(state)
    if (state.isPeeking) handlers.onPeek(null)
    state.isPeeking = false
    state.pointers.delete(event.pointerId)
  }
  canvas.addEventListener('pointercancel', forgetPointer, { signal })
  // a release the page never sees, like one under a context menu, would leave the map dragging
  canvas.addEventListener('lostpointercapture', forgetPointer, { signal })
  canvas.addEventListener(
    'pointerleave',
    () => {
      if (state.pointers.size === 0) handlers.onHover(null)
    },
    { signal }
  )
  return () => {
    cancelPeekTimer(state)
    controller.abort()
  }
}
