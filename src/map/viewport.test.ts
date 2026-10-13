import { describe, expect, it } from 'vitest'
import type { MapGeometry } from './format.ts'
import { fitViewport, panViewport, toGridPoint, zoomViewport } from './viewport.ts'

const WIDE_MAP: MapGeometry = { width: 4000, height: 2000, countries: [] }
const SCREEN = { width: 1000, height: 500 }
const CENTER = { x: 500, y: 250 }

const fitted = fitViewport(WIDE_MAP, SCREEN)
const zoomBy = (factor: number, anchor = CENTER) =>
  zoomViewport(fitted, { geometry: WIDE_MAP, size: SCREEN, factor, anchor })

describe('fitViewport', () => {
  it('centers the whole map with a small margin', () => {
    expect(fitted.scale).toBeCloseTo(0.24)
    expect(fitted.offsetX).toBeCloseTo(20)
    expect(fitted.offsetY).toBeCloseTo(10)
  })
})

describe('zoomViewport', () => {
  it('keeps the grid point under the anchor in place', () => {
    const anchor = { x: 300, y: 200 }
    const before = toGridPoint(fitted, anchor)
    const after = toGridPoint(zoomBy(2, anchor), anchor)
    expect(after.x).toBeCloseTo(before.x)
    expect(after.y).toBeCloseTo(before.y)
  })

  it('never zooms out past the fitted map or in past six times', () => {
    expect(zoomBy(0.1).scale).toBeCloseTo(fitted.scale)
    expect(zoomBy(100).scale).toBeCloseTo(fitted.scale * 6)
  })
})

describe('panViewport', () => {
  it('stops at the map edge instead of showing empty space', () => {
    const zoomed = zoomBy(4)
    const panned = panViewport(zoomed, { x: 10_000, y: 10_000 }, WIDE_MAP, SCREEN)
    expect(panned.offsetX).toBe(0)
    expect(panned.offsetY).toBe(0)
  })

  it('keeps the map centered while it is smaller than the screen', () => {
    const panned = panViewport(fitted, { x: 300, y: 0 }, WIDE_MAP, SCREEN)
    expect(panned.offsetX).toBeCloseTo(fitted.offsetX)
  })
})
