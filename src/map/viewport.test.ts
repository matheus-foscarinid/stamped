import { describe, expect, it } from 'vitest'
import type { MapGeometry } from './format.ts'
import { fitViewport, homeViewport, panViewport, toGridPoint, zoomViewport } from './viewport.ts'

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

  it('keeps the padding clear on the tighter side and centers the map', () => {
    const padded = fitViewport(WIDE_MAP, { ...SCREEN, padding: { x: 0, y: 100 } })
    const mapHeight = WIDE_MAP.height * padded.scale
    expect(padded.offsetY).toBeGreaterThanOrEqual(100)
    expect(padded.offsetY + mapHeight).toBeLessThanOrEqual(SCREEN.height - 100)
    expect(padded.offsetX).toBeCloseTo((SCREEN.width - WIDE_MAP.width * padded.scale) / 2)
  })
})

describe('homeViewport', () => {
  it('is the fitted map when there is no start zoom', () => {
    expect(homeViewport(WIDE_MAP, SCREEN, 1)).toEqual(fitted)
  })

  it('zooms into the middle of the map on tall screens', () => {
    const home = homeViewport(WIDE_MAP, SCREEN, 2)
    expect(home.scale).toBeCloseTo(fitted.scale * 2)
    expect(toGridPoint(home, CENTER).x).toBeCloseTo(WIDE_MAP.width / 2)
    expect(toGridPoint(home, CENTER).y).toBeCloseTo(WIDE_MAP.height / 2)
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
    expect(zoomBy(0.9).scale).toBeCloseTo(fitted.scale)
    expect(zoomBy(5.9).scale).toBeCloseTo(fitted.scale * 5.9)
    expect(zoomBy(6.1).scale).toBeCloseTo(fitted.scale * 6)
  })
})

describe('panViewport', () => {
  const zoomed = zoomBy(4)
  const farOffsetX = SCREEN.width - WIDE_MAP.width * zoomed.scale
  const farOffsetY = SCREEN.height - WIDE_MAP.height * zoomed.scale
  const dragTo = (offsetX: number, offsetY: number) =>
    panViewport(
      zoomed,
      { x: offsetX - zoomed.offsetX, y: offsetY - zoomed.offsetY },
      WIDE_MAP,
      SCREEN
    )

  it('follows the drag while the map still covers the screen', () => {
    const panned = dragTo(zoomed.offsetX + 100, zoomed.offsetY + 50)
    expect(panned.offsetX).toBeCloseTo(zoomed.offsetX + 100)
    expect(panned.offsetY).toBeCloseTo(zoomed.offsetY + 50)
  })

  it('stops at the top left edge instead of showing empty space', () => {
    const justShort = dragTo(-1, -1)
    const pastEdge = dragTo(1, 1)
    expect(justShort.offsetX).toBeCloseTo(-1)
    expect(justShort.offsetY).toBeCloseTo(-1)
    expect(pastEdge.offsetX).toBe(0)
    expect(pastEdge.offsetY).toBe(0)
  })

  it('stops at the bottom right edge instead of showing empty space', () => {
    const justShort = dragTo(farOffsetX + 1, farOffsetY + 1)
    const pastEdge = dragTo(farOffsetX - 1, farOffsetY - 1)
    expect(justShort.offsetX).toBeCloseTo(farOffsetX + 1)
    expect(justShort.offsetY).toBeCloseTo(farOffsetY + 1)
    expect(pastEdge.offsetX).toBeCloseTo(farOffsetX)
    expect(pastEdge.offsetY).toBeCloseTo(farOffsetY)
  })

  it('keeps the map centered while it is smaller than the screen', () => {
    const panned = panViewport(fitted, { x: 300, y: 0 }, WIDE_MAP, SCREEN)
    expect(panned.offsetX).toBeCloseTo(fitted.offsetX)
  })
})
