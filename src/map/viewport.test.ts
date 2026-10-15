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
    const edgeToEdge = SCREEN.width / WIDE_MAP.width
    expect(fitted.scale).toBeLessThan(edgeToEdge)
    expect(fitted.scale).toBeGreaterThan(edgeToEdge * 0.95)
    expect(fitted.offsetX).toBeCloseTo((SCREEN.width - WIDE_MAP.width * fitted.scale) / 2)
    expect(fitted.offsetY).toBeCloseTo((SCREEN.height - WIDE_MAP.height * fitted.scale) / 2)
    expect(fitted.offsetX).toBeGreaterThan(0)
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

  it('never zooms out past the fitted map or in past thirty-two times', () => {
    expect(zoomBy(0.9).scale).toBeCloseTo(fitted.scale)
    expect(zoomBy(31.9).scale).toBeCloseTo(fitted.scale * 31.9)
    expect(zoomBy(32.1).scale).toBeCloseTo(fitted.scale * 32)
  })
})

describe('zoomViewport while the map is still shorter than the screen', () => {
  const PADDED_SCREEN = { ...SCREEN, padding: { x: 0, y: 100 } }
  const paddedFit = fitViewport(WIDE_MAP, PADDED_SCREEN)
  const NEAR_TOP = { x: 500, y: 160 }
  const NEAR_BOTTOM = { x: 500, y: 340 }
  const zoomPadded = (view: typeof paddedFit, factor: number, anchor: typeof NEAR_TOP) =>
    zoomViewport(view, { geometry: WIDE_MAP, size: PADDED_SCREEN, factor, anchor })

  it.each([
    ['near the top', NEAR_TOP],
    ['near the bottom', NEAR_BOTTOM],
  ])('keeps the point under the cursor %s', (_, anchor) => {
    const zoomed = zoomPadded(paddedFit, 1.5, anchor)
    expect(WIDE_MAP.height * zoomed.scale).toBeLessThan(SCREEN.height)
    const before = toGridPoint(paddedFit, anchor)
    const after = toGridPoint(zoomed, anchor)
    expect(after.x).toBeCloseTo(before.x)
    expect(after.y).toBeCloseTo(before.y)
  })

  it('centers the world again once zoomed all the way out', () => {
    const zoomed = zoomPadded(paddedFit, 1.5, NEAR_TOP)
    expect(zoomPadded(zoomed, 0.1, NEAR_TOP)).toEqual(paddedFit)
  })
})

describe('panViewport', () => {
  const zoomed = zoomBy(4)
  const ROOM = { x: fitted.offsetX, y: fitted.offsetY }
  const farOffsetX = SCREEN.width - WIDE_MAP.width * zoomed.scale - ROOM.x
  const farOffsetY = SCREEN.height - WIDE_MAP.height * zoomed.scale - ROOM.y
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

  it('stops at the top left edge with the same margin as the whole world', () => {
    const justShort = dragTo(ROOM.x - 1, ROOM.y - 1)
    const pastEdge = dragTo(ROOM.x + 50, ROOM.y + 50)
    expect(justShort.offsetX).toBeCloseTo(ROOM.x - 1)
    expect(justShort.offsetY).toBeCloseTo(ROOM.y - 1)
    expect(pastEdge.offsetX).toBeCloseTo(ROOM.x)
    expect(pastEdge.offsetY).toBeCloseTo(ROOM.y)
  })

  it('stops at the bottom right edge with the same margin as the whole world', () => {
    const justShort = dragTo(farOffsetX + 1, farOffsetY + 1)
    const pastEdge = dragTo(farOffsetX - 50, farOffsetY - 50)
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
