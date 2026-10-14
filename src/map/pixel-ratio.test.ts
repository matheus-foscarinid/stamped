import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubPixelRatio } from '@/test/browser-stubs'
import { watchPixelRatio } from './pixel-ratio.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('when the window moves to a screen with another pixel density', () => {
  it('reports each move, not only the first', () => {
    const { moveToScreen } = stubPixelRatio(1)
    const onChange = vi.fn()
    watchPixelRatio(onChange)
    moveToScreen(2)
    moveToScreen(1)
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('stays quiet once stopped', () => {
    const { moveToScreen } = stubPixelRatio(2)
    const onChange = vi.fn()
    watchPixelRatio(onChange)()
    moveToScreen(1)
    expect(onChange).not.toHaveBeenCalled()
  })
})
