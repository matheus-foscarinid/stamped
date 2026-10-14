import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { createPointerEvent, stubCanvas } from '@/test/browser-stubs'
import { attachInteraction, type InteractionHandlers } from './interaction.ts'

const RIGHT_BUTTON = 2
const MIDDLE_BUTTON = 1

let canvas: ReturnType<typeof stubCanvas>
let handlers: { [Key in keyof InteractionHandlers]: Mock<InteractionHandlers[Key]> }

const click = (options: Parameters<typeof createPointerEvent>[1] = {}) => {
  canvas.dispatchEvent(createPointerEvent('pointerdown', options))
  canvas.dispatchEvent(createPointerEvent('pointerup', options))
}

beforeEach(() => {
  canvas = stubCanvas()
  handlers = {
    onZoom: vi.fn<InteractionHandlers['onZoom']>(),
    onPan: vi.fn<InteractionHandlers['onPan']>(),
    onTap: vi.fn<InteractionHandlers['onTap']>(),
    onHover: vi.fn<InteractionHandlers['onHover']>(),
  }
  attachInteraction(canvas as unknown as HTMLCanvasElement, handlers)
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
})

describe('after the page loses a press it never saw released', () => {
  it('goes back to hovering instead of dragging the map', () => {
    canvas.dispatchEvent(createPointerEvent('pointerdown', { x: 10, y: 10 }))
    canvas.dispatchEvent(createPointerEvent('lostpointercapture'))
    canvas.dispatchEvent(createPointerEvent('pointermove', { x: 40, y: 40 }))
    expect(handlers.onPan).not.toHaveBeenCalled()
    expect(handlers.onHover).toHaveBeenCalledWith({ x: 40, y: 40 })
  })
})
