import type { ScreenPoint } from './viewport.ts'

// how quickly an eased zoom catches up, in ms. it has settled after about four of these
const CATCH_UP_MS = 70
// in log scale
const SETTLED_ZOOM = 0.002

export interface ZoomAnimator {
  zoomBy: (factor: number, anchor: ScreenPoint) => void
  stop: () => void
}

// returns the factor the map really took, smaller than asked at a zoom limit
type ApplyZoom = (factor: number, anchor: ScreenPoint) => number

const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const isClamped = (asked: number, applied: number): boolean =>
  Math.abs(Math.log(applied) - asked) > SETTLED_ZOOM / 10

// ticks mid glide add up, so a fast wheel spin still goes all the way
export const createZoomAnimator = (applyZoom: ApplyZoom): ZoomAnimator => {
  let remaining = 0
  let anchor: ScreenPoint = { x: 0, y: 0 }
  let frame: number | null = null
  let lastTime = 0

  const isGliding = () => frame !== null

  const tick = (now: number) => {
    // a frame's time can be from just before the glide started, which would zoom the wrong way
    const elapsed = Math.max(0, now - lastTime)
    const share = 1 - Math.exp(-elapsed / CATCH_UP_MS)
    lastTime = now
    const step = Math.abs(remaining) < SETTLED_ZOOM ? remaining : remaining * share
    remaining -= step
    // past a limit the rest would only pile up and stall a zoom back the other way
    if (isClamped(step, applyZoom(Math.exp(step), anchor))) remaining = 0
    frame = remaining === 0 ? null : requestAnimationFrame(tick)
  }

  const stop = () => {
    if (frame !== null) cancelAnimationFrame(frame)
    frame = null
    remaining = 0
  }

  return {
    zoomBy: (factor, nextAnchor) => {
      if (prefersReducedMotion()) {
        applyZoom(factor, nextAnchor)
        return
      }
      remaining += Math.log(factor)
      anchor = nextAnchor
      if (isGliding()) return
      lastTime = performance.now()
      frame = requestAnimationFrame(tick)
    },
    stop,
  }
}
