import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createScaleRecorder, stubCanvas, stubMapPage } from '@/test/browser-stubs'
import { createWorldMap } from './index.ts'

vi.mock('./load.ts', () => ({
  loadGeometry: () => Promise.resolve({ width: 1000, height: 500, countries: [] }),
  loadCountryCodes: () => Promise.resolve([]),
}))

const SIZE = { width: 1000, height: 500 }
const FRAME_MS = 16
const SETTLE_MS = 1000

let frames: ReturnType<typeof stubMapPage>

const openMap = async () => {
  const { renderer, drawnScales } = createScaleRecorder(SIZE)
  const canvas = stubCanvas() as unknown as HTMLCanvasElement
  const map = await createWorldMap(canvas, { projection: 'natural-earth', renderer })
  return { map, drawnScales }
}

const runFor = (milliseconds: number) => {
  for (let time = 0; time < milliseconds; time += FRAME_MS) frames.advanceBy(FRAME_MS)
}

beforeEach(() => {
  frames = stubMapPage()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('when the projection changes mid glide', () => {
  it('drops the rest of the glide, so the new map rests at its home view', async () => {
    const { map, drawnScales } = await openMap()
    map.zoomBy(4)
    runFor(FRAME_MS)
    await map.setProjection('mercator')
    const homeScale = drawnScales.at(-1)
    runFor(SETTLE_MS)
    expect(drawnScales.at(-1)).toBe(homeScale)
  })
})
