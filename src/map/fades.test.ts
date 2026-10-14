import { afterEach, describe, expect, it, vi } from 'vitest'
import { stubAnimationFrames } from '@/test/browser-stubs'
import { createFadeAnimator, FADE_DURATION_MS } from './fades.ts'

const startFade = (options: { prefersReducedMotion?: boolean } = {}) => {
  const frames = stubAnimationFrames(options)
  const onFrame = vi.fn<(fading: ReadonlyMap<string, number>) => void>()
  const animator = createFadeAnimator(onFrame)
  animator.start(['br'])
  const lastFrame = () => onFrame.mock.lastCall?.[0]
  return { ...frames, animator, onFrame, lastFrame }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('while a country fades', () => {
  it('moves from its old color toward the new one', () => {
    const { advanceBy, lastFrame } = startFade()
    advanceBy(0)
    expect(lastFrame()?.get('br')).toBe(0)
    advanceBy(FADE_DURATION_MS / 2)
    expect(lastFrame()?.get('br')).toBeGreaterThan(0.5)
    expect(lastFrame()?.get('br')).toBeLessThan(1)
  })

  it('stops drawing frames when the page goes away', () => {
    const { animator, hasPendingFrame } = startFade()
    animator.stop()
    expect(hasPendingFrame()).toBe(false)
  })
})

describe('after the fade', () => {
  it('settles the country and stops asking for frames', () => {
    const { advanceBy, lastFrame, hasPendingFrame } = startFade()
    advanceBy(FADE_DURATION_MS)
    expect(lastFrame()?.has('br')).toBe(false)
    expect(hasPendingFrame()).toBe(false)
  })
})

describe('with reduced motion', () => {
  it('switches colors at once without animating', () => {
    const { onFrame, hasPendingFrame } = startFade({ prefersReducedMotion: true })
    expect(hasPendingFrame()).toBe(false)
    expect(onFrame).not.toHaveBeenCalled()
  })
})
