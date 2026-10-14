import { onScopeDispose, type ShallowRef, watch } from 'vue'
import { watchPixelRatio } from '@/map'

interface UseCanvasRedrawInput {
  canvas: Readonly<ShallowRef<HTMLCanvasElement | null>>
  redraw: () => void
}

// a canvas keeps the pixels it was drawn with, so a new size, density or theme needs a fresh drawing
export const useCanvasRedraw = ({ canvas, redraw }: UseCanvasRedrawInput): void => {
  const resizeObserver = new ResizeObserver(redraw)
  const themeObserver = new MutationObserver(redraw)
  themeObserver.observe(document.documentElement, { attributeFilter: ['data-theme'] })
  const stopWatchingPixelRatio = watchPixelRatio(redraw)

  watch(canvas, (element, previous) => {
    if (previous) resizeObserver.unobserve(previous)
    if (element) resizeObserver.observe(element)
  })
  onScopeDispose(() => {
    resizeObserver.disconnect()
    themeObserver.disconnect()
    stopWatchingPixelRatio()
  })
}
