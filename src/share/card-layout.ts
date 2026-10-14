import { MAP_ASPECT, type ScreenRect } from '@/map'

export const EXPORT_FORMAT_IDS = ['post', 'story', 'wide'] as const

export type ExportFormat = (typeof EXPORT_FORMAT_IDS)[number]

interface ExportFormatSpec {
  width: number
  height: number
  safeInset?: number
}

export const EXPORT_FORMATS: Record<ExportFormat, ExportFormatSpec> = {
  post: { width: 1080, height: 1350 },
  // stories put the profile bar and reply box over the top and bottom of the image
  story: { width: 1080, height: 1920, safeInset: 250 },
  wide: { width: 1200, height: 630 },
}

interface ExportFormatOption {
  id: ExportFormat
  size: string
}

export const formatImageSize = ({ width, height }: { width: number; height: number }): string =>
  `${width} × ${height}`

export const EXPORT_FORMAT_OPTIONS: ExportFormatOption[] = EXPORT_FORMAT_IDS.map(id => ({
  id,
  size: formatImageSize(EXPORT_FORMATS[id]),
}))

const PADDING_RATIO = 0.07
const TILE_GAP = 24
const WIDE_COLUMN_RATIO = 0.4
const WIDE_COLUMN_GAP = 40

// font sizes at a 1080 wide card. the wide card scales them from its height instead
const TYPE = {
  logo: 64,
  wordmark: 46,
  eyebrow: 24,
  count: 132,
  countLabel: 46,
  progress: 30,
  bar: 14,
  tileValue: 60,
  tileLabel: 28,
  footer: 28,
}

type CardType = Record<keyof typeof TYPE, number>

type TextBlock = 'header' | 'eyebrow' | 'count' | 'countLabel' | 'progress' | 'tiles' | 'footer'

// each block's height in type sizes, and the gap above it
const STACK: { block: TextBlock; height: (type: CardType) => number; gap: number }[] = [
  { block: 'header', height: type => type.logo, gap: 0 },
  { block: 'eyebrow', height: type => type.eyebrow * 1.3, gap: 32 },
  { block: 'count', height: type => type.count * 0.86, gap: 24 },
  { block: 'countLabel', height: type => type.countLabel * 1.3, gap: 4 },
  { block: 'progress', height: type => type.progress * 1.3 + type.bar * 2, gap: 34 },
  { block: 'tiles', height: type => type.tileValue + type.tileLabel * 2.8, gap: 26 },
  { block: 'footer', height: type => type.footer * 1.3, gap: 30 },
]

// the map sits between the count and the progress bar on tall cards
const MAP_GAP = 30
const MAP_AFTER: TextBlock = 'countLabel'

export interface CardLayout {
  align: 'center' | 'start'
  type: CardType
  blocks: Record<TextBlock, ScreenRect>
  tiles: [ScreenRect, ScreenRect]
  map: ScreenRect
}

const scaleType = (scale: number): CardType =>
  Object.fromEntries(
    Object.entries(TYPE).map(([key, size]) => [key, Math.round(size * scale)])
  ) as CardType

const splitTiles = ({ x, y, width, height }: ScreenRect, gap: number): [ScreenRect, ScreenRect] => {
  const tileWidth = (width - gap) / 2
  return [
    { x, y, width: tileWidth, height },
    { x: x + tileWidth + gap, y, width: tileWidth, height },
  ]
}

interface StackInput {
  area: ScreenRect
  type: CardType
  scale: number
  map?: { width: number; maxHeight: number }
}

// stacks the blocks top to bottom, gives the map what's left and centres the whole stack
const stackBlocks = ({ area, type, scale, map }: StackInput) => {
  const textHeight = STACK.reduce((sum, item) => sum + item.height(type) + item.gap * scale, 0)
  const mapRoom = map ? area.height - textHeight - MAP_GAP * scale * 2 : 0
  const mapHeight = map ? Math.max(0, Math.min(mapRoom, map.maxHeight)) : 0
  const mapBlockHeight = map ? mapHeight + MAP_GAP * scale * 2 : 0
  let y = area.y + (area.height - textHeight - mapBlockHeight) / 2
  let mapRect: ScreenRect = { x: area.x, y: area.y, width: 0, height: 0 }
  const blocks = {} as Record<TextBlock, ScreenRect>
  for (const item of STACK) {
    y += item.gap * scale
    blocks[item.block] = { x: area.x, y, width: area.width, height: item.height(type) }
    y += item.height(type)
    if (map && item.block === MAP_AFTER) {
      const x = area.x + (area.width - map.width) / 2
      mapRect = { x, y: y + MAP_GAP * scale, width: map.width, height: mapHeight }
      y += mapBlockHeight
    }
  }
  return { blocks, map: mapRect }
}

const layoutTallCard = ({ width, height, safeInset }: ExportFormatSpec): CardLayout => {
  const scale = width / 1080
  const padding = Math.round(width * PADDING_RATIO)
  const inset = safeInset ?? padding
  const area = { x: padding, y: inset, width: width - padding * 2, height: height - inset * 2 }
  const type = scaleType(scale)
  // the map runs edge to edge, the land itself never touches the sides
  const mapWidth = width
  const stack = stackBlocks({
    area,
    type,
    scale,
    map: { width: mapWidth, maxHeight: mapWidth / MAP_ASPECT },
  })
  const tiles = splitTiles(stack.blocks.tiles, TILE_GAP * scale)
  return { align: 'center', type, blocks: stack.blocks, tiles, map: stack.map }
}

const layoutWideCard = ({ width, height }: ExportFormatSpec): CardLayout => {
  const scale = height / 1080
  const padding = Math.round(height * PADDING_RATIO)
  const inner = { x: padding, y: padding, width: width - padding * 2, height: height - padding * 2 }
  const columnWidth = inner.width * WIDE_COLUMN_RATIO
  const column = { ...inner, width: columnWidth }
  const type = scaleType(scale * 1.25)
  const { blocks } = stackBlocks({ area: column, type, scale })
  const mapX = inner.x + columnWidth + WIDE_COLUMN_GAP * scale
  const map = { x: mapX, y: 0, width: width - mapX, height }
  return { align: 'start', type, blocks, tiles: splitTiles(blocks.tiles, TILE_GAP * scale), map }
}

export const layoutCard = (format: ExportFormat): CardLayout => {
  const spec = EXPORT_FORMATS[format]
  return format === 'wide' ? layoutWideCard(spec) : layoutTallCard(spec)
}
