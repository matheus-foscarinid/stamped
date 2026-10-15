import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubAnimationFrames } from '@/test/browser-stubs'
import { createZoomAnimator } from './zoom-animator.ts'

const ANCHOR = { x: 10, y: 20 }
const FRAME_MS = 16
const SETTLE_MS = 1000
const IDLE_MS = 5000

interface GlideOptions {
  prefersReducedMotion?: boolean
  maxZoom?: number
}

// a map that stops at maxZoom, like the real one at its deepest
const startGlide = ({ prefersReducedMotion = false, maxZoom = Infinity }: GlideOptions = {}) => {
  const frames = stubAnimationFrames({ prefersReducedMotion })
  let zoom = 1
  const applyZoom = vi.fn((factor: number, _anchor: typeof ANCHOR) => {
    const previous = zoom
    zoom = Math.min(zoom * factor, maxZoom)
    return zoom / previous
  })
  const animator = createZoomAnimator(applyZoom)
  const totalZoom = () => zoom
  const runFor = (milliseconds: number) => {
    for (let time = 0; time < milliseconds; time += FRAME_MS) frames.advanceBy(FRAME_MS)
  }
  return { ...frames, animator, applyZoom, totalZoom, runFor }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('while a zoom glides', () => {
  it('eases in around the asked anchor from the first frame, even after the page sat idle', () => {
    const { animator, applyZoom, totalZoom, runFor, advanceBy } = startGlide()
    advanceBy(IDLE_MS)
    animator.zoomBy(2, ANCHOR)
    runFor(FRAME_MS)
    expect(totalZoom()).toBeGreaterThan(1)
    expect(totalZoom()).toBeLessThan(2)
    expect(applyZoom.mock.lastCall?.[1]).toEqual(ANCHOR)
  })

  it('lands exactly on the zoom asked for, then stops drawing', () => {
    const { animator, totalZoom, runFor, hasPendingFrame } = startGlide()
    animator.zoomBy(2, ANCHOR)
    runFor(SETTLE_MS)
    expect(totalZoom()).toBeCloseTo(2)
    expect(hasPendingFrame()).toBe(false)
  })

  it('adds up ticks that land mid glide, still drawing once per frame', () => {
    const { animator, applyZoom, totalZoom, runFor } = startGlide()
    animator.zoomBy(2, ANCHOR)
    runFor(FRAME_MS)
    animator.zoomBy(2, ANCHOR)
    const drawsBefore = applyZoom.mock.calls.length
    runFor(FRAME_MS)
    expect(applyZoom).toHaveBeenCalledTimes(drawsBefore + 1)
    runFor(SETTLE_MS)
    expect(totalZoom()).toBeCloseTo(4)
  })

  it('turns back at once after spinning past the deepest zoom', () => {
    const { animator, totalZoom, runFor } = startGlide({ maxZoom: 2 })
    animator.zoomBy(64, ANCHOR)
    runFor(FRAME_MS * 4)
    animator.zoomBy(1 / 2, ANCHOR)
    runFor(SETTLE_MS)
    expect(totalZoom()).toBeCloseTo(1)
  })

  it('drops what is left once stopped', () => {
    const { animator, totalZoom, runFor, hasPendingFrame } = startGlide()
    animator.zoomBy(2, ANCHOR)
    runFor(FRAME_MS)
    animator.stop()
    expect(hasPendingFrame()).toBe(false)
    const reached = totalZoom()
    runFor(SETTLE_MS)
    expect(totalZoom()).toBe(reached)
  })
})

describe('when the visitor asks for less motion', () => {
  it('zooms all the way at once', () => {
    const { animator, applyZoom, hasPendingFrame } = startGlide({ prefersReducedMotion: true })
    animator.zoomBy(2, ANCHOR)
    expect(applyZoom).toHaveBeenCalledExactlyOnceWith(2, ANCHOR)
    expect(hasPendingFrame()).toBe(false)
  })
})
