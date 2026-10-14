import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { shallowRef } from 'vue'
import { mountComposable, mountWithElement } from '@/test/composables'
import { stubRedrawObservers } from '@/test/layout-stubs'
import { useCanvasRedraw } from './useCanvasRedraw.ts'

const CANVAS = {} as HTMLCanvasElement
const NEW_CANVAS = {} as HTMLCanvasElement

let observers: ReturnType<typeof stubRedrawObservers>
let redraw: () => void

beforeEach(() => {
  observers = stubRedrawObservers()
  redraw = vi.fn()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const mountRedraw = async () => {
  const mounted = mountWithElement(CANVAS, canvas => useCanvasRedraw({ canvas, redraw }))
  await Promise.resolve()
  return mounted
}

describe('while the canvas is on the page', () => {
  it('redraws when the canvas changes size', async () => {
    await mountRedraw()
    observers.resize(CANVAS)
    expect(redraw).toHaveBeenCalledOnce()
  })

  it('redraws when the theme changes', async () => {
    await mountRedraw()
    observers.switchTheme()
    expect(redraw).toHaveBeenCalledOnce()
  })

  it('redraws when the window moves to a screen with another pixel density', async () => {
    await mountRedraw()
    observers.changePixelRatio()
    expect(redraw).toHaveBeenCalledOnce()
  })

  it('follows a new canvas and lets go of the old one', async () => {
    const canvas = shallowRef<HTMLCanvasElement | null>(null)
    mountComposable(() => ({ redraw: useCanvasRedraw({ canvas, redraw }) }))
    canvas.value = CANVAS
    await Promise.resolve()
    canvas.value = NEW_CANVAS
    await Promise.resolve()
    observers.resize(CANVAS)
    expect(redraw).not.toHaveBeenCalled()
    observers.resize(NEW_CANVAS)
    expect(redraw).toHaveBeenCalledOnce()
  })
})

describe('after the canvas goes away', () => {
  it('stops redrawing', async () => {
    const { unmount } = await mountRedraw()
    unmount()
    observers.resize(CANVAS)
    observers.switchTheme()
    observers.changePixelRatio()
    expect(redraw).not.toHaveBeenCalled()
  })
})
