export const FADE_DURATION_MS = 320

export interface FadeAnimator {
  start: (codes: Iterable<string>) => void
  stop: () => void
}

const easeOutCubic = (progress: number): number => 1 - (1 - progress) ** 3

const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// eases freshly toggled countries into their new color, one frame at a time
export const createFadeAnimator = (
  onFrame: (fading: ReadonlyMap<string, number>) => void
): FadeAnimator => {
  const startTimes = new Map<string, number>()
  let frame = 0

  const tick = (now: number) => {
    const fading = new Map<string, number>()
    for (const [code, startTime] of startTimes) {
      const progress = Math.max(0, (now - startTime) / FADE_DURATION_MS)
      if (progress >= 1) startTimes.delete(code)
      else fading.set(code, easeOutCubic(progress))
    }
    onFrame(fading)
    frame = startTimes.size > 0 ? requestAnimationFrame(tick) : 0
  }

  return {
    start: codes => {
      if (prefersReducedMotion()) return
      const now = performance.now()
      for (const code of codes) startTimes.set(code, now)
      if (startTimes.size > 0 && frame === 0) frame = requestAnimationFrame(tick)
    },
    stop: () => cancelAnimationFrame(frame),
  }
}
