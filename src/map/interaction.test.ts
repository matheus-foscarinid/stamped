import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { createPointerEvent, createWheelEvent, stubCanvas } from '@/test/browser-stubs'
import { attachInteraction, type InteractionHandlers } from './interaction.ts'

const RIGHT_BUTTON = 2
const MIDDLE_BUTTON = 1
const LINE_MODE = 1
const FIRST_FINGER = { pointerId: 1, pointerType: 'touch' }
const SECOND_FINGER = { pointerId: 2, pointerType: 'touch' }

let canvas: ReturnType<typeof stubCanvas>
let handlers: { [Key in keyof InteractionHandlers]: Mock<InteractionHandlers[Key]> }
let detach: () => void

const click = (options: Parameters<typeof createPointerEvent>[1] = {}) => {
  canvas.dispatchEvent(createPointerEvent('pointerdown', options))
  canvas.dispatchEvent(createPointerEvent('pointerup', options))
}

beforeEach(() => {
  canvas = stubCanvas()
  handlers = {
    onZoom: vi.fn<InteractionHandlers['onZoom']>(),
    onEasedZoom: vi.fn<InteractionHandlers['onEasedZoom']>(),
    onPan: vi.fn<InteractionHandlers['onPan']>(),
    onTap: vi.fn<InteractionHandlers['onTap']>(),
    onHover: vi.fn<InteractionHandlers['onHover']>(),
    onPeek: vi.fn<InteractionHandlers['onPeek']>(),
  }
  detach = attachInteraction(canvas as unknown as HTMLCanvasElement, handlers)
})

describe('when a country is clicked', () => {
  it('stamps it with the main mouse button or a finger', () => {
    click()
    click({ pointerType: 'touch' })
    expect(handlers.onTap).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['right', RIGHT_BUTTON],
    ['middle', MIDDLE_BUTTON],
  ])('ignores the %s mouse button', (_name, button) => {
    click({ button })
    expect(handlers.onTap).not.toHaveBeenCalled()
  })

  it.each([
    [4, 1],
    [6, 0],
  ])('counts a press that slid %spx before lifting as %s tap(s)', (distance, taps) => {
    canvas.dispatchEvent(createPointerEvent('pointerdown', { x: 10, y: 10 }))
    canvas.dispatchEvent(createPointerEvent('pointermove', { x: 10, y: 10 + distance }))
    canvas.dispatchEvent(createPointerEvent('pointerup', { x: 10, y: 10 + distance }))
    expect(handlers.onTap).toHaveBeenCalledTimes(taps)
  })
})

describe('when a finger rests on the map', () => {
  const HOLD_MS = 300
  const touchAt = (type: string, x: number, y = 10) =>
    canvas.dispatchEvent(createPointerEvent(type, { ...FIRST_FINGER, x, y }))

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('names the country under a quick tap as well as stamping it', () => {
    touchAt('pointerdown', 10)
    touchAt('pointerup', 10)
    expect(handlers.onTap).toHaveBeenCalledOnce()
    expect(handlers.onPeek.mock.calls).toEqual([[{ x: 10, y: 10 }], [null]])
  })

  it('reads the countries a held finger slides over, without panning or stamping', () => {
    touchAt('pointerdown', 10)
    vi.advanceTimersByTime(HOLD_MS)
    touchAt('pointermove', 60)
    touchAt('pointerup', 60)
    expect(handlers.onPeek.mock.calls).toEqual([[{ x: 10, y: 10 }], [{ x: 60, y: 10 }], [null]])
    expect(handlers.onPan).not.toHaveBeenCalled()
    expect(handlers.onTap).not.toHaveBeenCalled()
  })

  it('drags the map when the finger moves before the hold', () => {
    touchAt('pointerdown', 10)
    touchAt('pointermove', 60)
    vi.advanceTimersByTime(HOLD_MS)
    expect(handlers.onPeek).not.toHaveBeenCalled()
    expect(handlers.onPan).toHaveBeenCalled()
  })

  it('stops reading names once a second finger starts a pinch', () => {
    touchAt('pointerdown', 10)
    vi.advanceTimersByTime(HOLD_MS)
    canvas.dispatchEvent(createPointerEvent('pointerdown', { ...SECOND_FINGER, x: 90, y: 10 }))
    touchAt('pointermove', 0)
    expect(handlers.onPeek).toHaveBeenLastCalledWith(null)
    expect(handlers.onZoom).toHaveBeenCalled()
  })

  it('never peeks for a mouse held still', () => {
    canvas.dispatchEvent(createPointerEvent('pointerdown'))
    vi.advanceTimersByTime(HOLD_MS)
    canvas.dispatchEvent(createPointerEvent('pointerup'))
    expect(handlers.onPeek).not.toHaveBeenCalled()
  })
})

describe('after the page loses a press it never saw released', () => {
  it.each(['lostpointercapture', 'pointercancel'])(
    'goes back to hovering on %s instead of dragging the map',
    type => {
      canvas.dispatchEvent(createPointerEvent('pointerdown', { x: 10, y: 10 }))
      canvas.dispatchEvent(createPointerEvent(type))
      canvas.dispatchEvent(createPointerEvent('pointermove', { x: 40, y: 40 }))
      expect(handlers.onPan).not.toHaveBeenCalled()
      expect(handlers.onHover).toHaveBeenCalledWith({ x: 40, y: 40 })
    }
  )
})

describe('while two fingers pinch', () => {
  const placeFingers = () => {
    canvas.dispatchEvent(createPointerEvent('pointerdown', { ...FIRST_FINGER, x: 100, y: 100 }))
    canvas.dispatchEvent(createPointerEvent('pointerdown', { ...SECOND_FINGER, x: 200, y: 100 }))
  }

  it('zooms by how far the fingers spread, around the spot between them', () => {
    placeFingers()
    canvas.dispatchEvent(createPointerEvent('pointermove', { ...SECOND_FINGER, x: 300, y: 100 }))
    expect(handlers.onZoom).toHaveBeenCalledWith(2, { x: 150, y: 100 })
  })

  it('drags the map along when both fingers move the same way', () => {
    placeFingers()
    canvas.dispatchEvent(createPointerEvent('pointermove', { ...FIRST_FINGER, x: 100, y: 160 }))
    canvas.dispatchEvent(createPointerEvent('pointermove', { ...SECOND_FINGER, x: 200, y: 160 }))
    const panned = handlers.onPan.mock.calls.reduce((total, [delta]) => total + delta.y, 0)
    expect(panned).toBeCloseTo(60)
  })

  it('never stamps a country when the fingers lift', () => {
    placeFingers()
    canvas.dispatchEvent(createPointerEvent('pointerup', FIRST_FINGER))
    canvas.dispatchEvent(createPointerEvent('pointerup', SECOND_FINGER))
    expect(handlers.onTap).not.toHaveBeenCalled()
  })
})

describe('when the wheel turns', () => {
  it('eases a mouse wheel tick in, zooming in on a turn away', () => {
    canvas.dispatchEvent(createWheelEvent({ deltaY: -100, x: 40, y: 30 }))
    const [factor, anchor] = handlers.onEasedZoom.mock.lastCall ?? []
    expect(factor).toBeGreaterThan(1)
    expect(anchor).toEqual({ x: 40, y: 30 })
    expect(handlers.onZoom).not.toHaveBeenCalled()
  })

  it('reads a wheel that counts in lines as the pixels it covers', () => {
    canvas.dispatchEvent(createWheelEvent({ deltaY: 3, deltaMode: LINE_MODE }))
    canvas.dispatchEvent(createWheelEvent({ deltaY: 48 }))
    const [byLines, byPixels] = handlers.onEasedZoom.mock.calls.map(([factor]) => factor)
    expect(byLines).toBeCloseTo(byPixels ?? 0)
  })

  it('follows a trackpad pinch at once, and faster than a wheel', () => {
    canvas.dispatchEvent(createWheelEvent({ deltaY: -10, ctrlKey: true }))
    canvas.dispatchEvent(createWheelEvent({ deltaY: -10 }))
    const [pinch] = handlers.onZoom.mock.lastCall ?? []
    const [wheel] = handlers.onEasedZoom.mock.lastCall ?? []
    expect(pinch).toBeGreaterThan(wheel ?? 0)
  })

  it.each([
    ['pixels', { deltaY: -100 }],
    ['lines', { deltaY: -3, deltaMode: LINE_MODE }],
  ])('eases a mouse wheel notch in %s with ctrl held, like one without', (_unit, notch) => {
    canvas.dispatchEvent(createWheelEvent({ ...notch, ctrlKey: true }))
    canvas.dispatchEvent(createWheelEvent(notch))
    const [withCtrl, without] = handlers.onEasedZoom.mock.calls.map(([factor]) => factor)
    expect(withCtrl).toBeCloseTo(without ?? 0)
    expect(handlers.onZoom).not.toHaveBeenCalled()
  })

  it('keeps the page from scrolling', () => {
    const wheel = createWheelEvent({ deltaY: 100 })
    canvas.dispatchEvent(wheel)
    expect(wheel.defaultPrevented).toBe(true)
  })
})

describe('when the pointer leaves the map', () => {
  it('clears the hovered country', () => {
    canvas.dispatchEvent(createPointerEvent('pointerleave'))
    expect(handlers.onHover).toHaveBeenCalledExactlyOnceWith(null)
  })

  it('keeps it while a drag is still going', () => {
    canvas.dispatchEvent(createPointerEvent('pointerdown'))
    canvas.dispatchEvent(createPointerEvent('pointerleave'))
    expect(handlers.onHover).not.toHaveBeenCalled()
  })
})

describe('once detached', () => {
  it('ignores the wheel and the pointer', () => {
    detach()
    click()
    canvas.dispatchEvent(createWheelEvent({ deltaY: -100 }))
    expect(handlers.onTap).not.toHaveBeenCalled()
    expect(handlers.onEasedZoom).not.toHaveBeenCalled()
  })
})
