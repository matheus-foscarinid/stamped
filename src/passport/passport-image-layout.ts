import type { ScreenRect } from '@/map'

export const PASSPORT_IMAGE = { width: 2000, height: 1300 }

const MARGIN = 70
const COVER_PADDING = 18
const PAGE_PADDING = 64
const MAX_STAMP_CELL = 240
// map's aspect ratio, so it fills the box
export const MAP_ASPECT = 2.2
const MAP_BLEED = 24

const HEADER_HEIGHT = 40
const HEADER_GAP = 40
const HEADLINE_HEIGHT = 90
const STATS_HEIGHT = 84
const BLOCK_GAP = 36
const MACHINE_LINE_HEIGHT = 36
const MACHINE_PADDING = 24

export interface PassportImageLayout {
  book: ScreenRect
  pages: [ScreenRect, ScreenRect]
  stampArea: ScreenRect
  stampCells: ScreenRect[]
  header: ScreenRect
  map: ScreenRect
  headline: ScreenRect
  stats: ScreenRect
  machine: ScreenRect
}

const insetRect = ({ x, y, width, height }: ScreenRect, inset: number): ScreenRect => ({
  x: x + inset,
  y: y + inset,
  width: width - inset * 2,
  height: height - inset * 2,
})

const pickColumnCount = (area: ScreenRect, count: number): number => {
  let best = { columns: 1, cell: 0 }
  for (let columns = 1; columns <= count; columns++) {
    const rows = Math.ceil(count / columns)
    const cell = Math.min(area.width / columns, area.height / rows, MAX_STAMP_CELL)
    if (cell > best.cell) best = { columns, cell }
  }
  return best.columns
}

// largest square cells that fit every stamp
const fitStampGrid = (area: ScreenRect, count: number): ScreenRect[] => {
  if (count === 0) return []
  const columns = pickColumnCount(area, count)
  const rows = Math.ceil(count / columns)
  const cell = Math.min(area.width / columns, area.height / rows, MAX_STAMP_CELL)
  const left = area.x + (area.width - columns * cell) / 2
  return Array.from({ length: count }, (_, index) => ({
    x: left + (index % columns) * cell,
    y: area.y + Math.floor(index / columns) * cell,
    width: cell,
    height: cell,
  }))
}

const stackBlock = (area: ScreenRect, top: number, height: number): ScreenRect => ({
  x: area.x,
  y: top,
  width: area.width,
  height,
})

const layoutDataPage = (area: ScreenRect) => {
  const header = stackBlock(area, area.y, HEADER_HEIGHT)
  const machineHeight = MACHINE_LINE_HEIGHT * 2 + MACHINE_PADDING
  const machine = stackBlock(area, area.y + area.height - machineHeight, machineHeight)
  const mapWidth = area.width + MAP_BLEED * 2
  const mapHeight = mapWidth / MAP_ASPECT
  const middleHeight = mapHeight + BLOCK_GAP + HEADLINE_HEIGHT + BLOCK_GAP + STATS_HEIGHT
  const freeTop = header.y + header.height + HEADER_GAP
  const freeHeight = machine.y - freeTop - middleHeight
  const mapTop = freeTop + Math.max(0, freeHeight / 2)
  const map = { x: area.x - MAP_BLEED, y: mapTop, width: mapWidth, height: mapHeight }
  const headline = stackBlock(area, map.y + map.height + BLOCK_GAP, HEADLINE_HEIGHT)
  const stats = stackBlock(area, headline.y + headline.height + BLOCK_GAP, STATS_HEIGHT)
  return { header, map, headline, stats, machine }
}

export const layoutPassportImage = (stampCount: number): PassportImageLayout => {
  const book = insetRect({ x: 0, y: 0, ...PASSPORT_IMAGE }, MARGIN)
  const inner = insetRect(book, COVER_PADDING)
  const pageWidth = inner.width / 2
  const pages: [ScreenRect, ScreenRect] = [
    { ...inner, width: pageWidth },
    { ...inner, x: inner.x + pageWidth, width: pageWidth },
  ]
  const stampArea = insetRect(pages[0], PAGE_PADDING)
  return {
    book,
    pages,
    stampArea,
    stampCells: fitStampGrid(stampArea, stampCount),
    ...layoutDataPage(insetRect(pages[1], PAGE_PADDING)),
  }
}
