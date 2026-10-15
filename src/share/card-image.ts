import { drawLogo } from '@/brand/draw-logo'
import { APP_NAME } from '@/brand/logo'
import type { CountryCode } from '@/countries'
import { drawWorldSnapshot, type ProjectionId, type ScreenRect } from '@/map'
import { readCssTokens } from '@/styles/css-tokens'
import { createExportCanvas, toPngBlob } from './canvas-export.ts'
import { drawSpacedText } from './canvas-text.ts'
import { type CardLayout, EXPORT_FORMATS, type ExportFormat, layoutCard } from './card-layout.ts'

const EXPORT_BORDER_WIDTH_PX = 1.2
const GLOW_ALPHA = 0.18
const TILE_RADIUS_RATIO = 0.16

const THEME_TOKENS = {
  background: '--surface',
  text: '--text',
  muted: '--text-muted',
  font: '--font',
  visited: '--map-visited',
  track: '--control-hover-bg',
  tile: '--glass-bg',
  line: '--glass-line',
}

type CardTheme = Record<keyof typeof THEME_TOKENS, string>

interface Paint {
  context: CanvasRenderingContext2D
  theme: CardTheme
  layout: CardLayout
}

interface CardTile {
  value: string
  label: string
}

export interface CardText {
  eyebrow: string
  count: string
  countLabel: string
  progressLabel: string
  share: string
  tiles: [CardTile, CardTile]
  footer: string
}

export interface CardContent {
  projection: ProjectionId
  visited: readonly CountryCode[]
  wishlist: readonly CountryCode[]
  // visited share of every country, from 0 to 1
  progress: number
  text: CardText
}

interface TextLine {
  text: string
  rect: ScreenRect
  size: number
  weight: number
  color: string
  spacing?: number
}

const drawBackground = ({ context, theme }: Paint) => {
  const { width, height } = context.canvas
  context.fillStyle = theme.background
  context.fillRect(0, 0, width, height)
  const glow = context.createRadialGradient(width / 2, 0, 0, width / 2, 0, height * 0.7)
  glow.addColorStop(0, theme.visited)
  glow.addColorStop(1, 'transparent')
  context.save()
  context.globalAlpha = GLOW_ALPHA
  context.fillStyle = glow
  context.fillRect(0, 0, width, height)
  context.restore()
}

const anchorX = ({ layout }: Paint, rect: ScreenRect): number =>
  layout.align === 'center' ? rect.x + rect.width / 2 : rect.x

const drawLine = (paint: Paint, line: TextLine) => {
  const { context, theme, layout } = paint
  context.font = `${line.weight} ${line.size}px ${theme.font}`
  context.fillStyle = line.color
  context.textBaseline = 'middle'
  const y = line.rect.y + line.rect.height / 2
  const x = anchorX(paint, line.rect)
  if (line.spacing) {
    drawSpacedText(context, { text: line.text, x, y, spacing: line.spacing, align: layout.align })
    return
  }
  context.textAlign = layout.align === 'center' ? 'center' : 'start'
  context.fillText(line.text, x, y)
  context.textAlign = 'start'
}

const drawHeader = (paint: Paint) => {
  const { context, theme, layout } = paint
  const { header } = layout.blocks
  const { logo, wordmark } = layout.type
  const gap = logo * 0.3
  context.font = `700 ${wordmark}px ${theme.font}`
  const total = logo + gap + context.measureText(APP_NAME).width
  const left = layout.align === 'center' ? header.x + (header.width - total) / 2 : header.x
  drawLogo(context, { x: left, y: header.y, size: logo, frame: theme.muted, globe: theme.visited })
  const nameRect = { ...header, x: left + logo + gap, width: 0 }
  drawLine(
    { ...paint, layout: { ...layout, align: 'start' } },
    {
      text: APP_NAME,
      rect: nameRect,
      size: wordmark,
      weight: 700,
      color: theme.text,
    }
  )
}

const fillRoundedRect = (context: CanvasRenderingContext2D, rect: ScreenRect, radius: number) => {
  context.beginPath()
  context.roundRect(rect.x, rect.y, rect.width, rect.height, radius)
  context.fill()
}

const drawProgress = (paint: Paint, { text, progress }: CardContent) => {
  const { context, theme, layout } = paint
  const rect = layout.blocks.progress
  const { bar, progress: size } = layout.type
  const labelRect = { ...rect, height: size * 1.3 }
  const startLayout = { ...layout, align: 'start' as const }
  const line = { size, weight: 500, color: theme.muted }
  drawLine(
    { ...paint, layout: startLayout },
    { ...line, text: text.progressLabel, rect: labelRect }
  )
  context.textAlign = 'end'
  context.font = `600 ${size}px ${theme.font}`
  context.fillStyle = theme.text
  context.fillText(text.share, rect.x + rect.width, labelRect.y + labelRect.height / 2)
  context.textAlign = 'start'
  const track = { ...rect, y: rect.y + rect.height - bar, height: bar }
  context.fillStyle = theme.track
  fillRoundedRect(context, track, bar / 2)
  // a sliver of progress still shows as a dot, like the bar in the reference designs
  const filled = Math.max(bar, track.width * progress)
  context.fillStyle = theme.visited
  fillRoundedRect(context, { ...track, width: Math.min(filled, track.width) }, bar / 2)
}

const drawTile = (paint: Paint, rect: ScreenRect, tile: CardTile) => {
  const { context, theme, layout } = paint
  const { tileValue, tileLabel } = layout.type
  context.fillStyle = theme.tile
  fillRoundedRect(context, rect, rect.height * TILE_RADIUS_RATIO)
  context.strokeStyle = theme.line
  context.lineWidth = 2
  context.stroke()
  const inner = { ...rect, x: rect.x + tileLabel, width: rect.width - tileLabel * 2 }
  const startPaint = { ...paint, layout: { ...layout, align: 'start' as const } }
  const valueRect = { ...inner, y: rect.y + tileLabel, height: tileValue }
  drawLine(startPaint, {
    text: tile.value,
    rect: valueRect,
    size: tileValue,
    weight: 800,
    color: theme.text,
  })
  const labelRect = { ...inner, y: valueRect.y + tileValue, height: tileLabel * 1.3 }
  drawLine(startPaint, {
    text: tile.label,
    rect: labelRect,
    size: tileLabel,
    weight: 500,
    color: theme.muted,
  })
}

const drawText = (paint: Paint, content: CardContent) => {
  const { theme, layout } = paint
  const { blocks, type } = layout
  const { text } = content
  drawHeader(paint)
  drawLine(paint, {
    text: text.eyebrow.toLocaleUpperCase(),
    rect: blocks.eyebrow,
    size: type.eyebrow,
    weight: 700,
    color: theme.muted,
    spacing: type.eyebrow * 0.24,
  })
  drawLine(paint, {
    text: text.count,
    rect: blocks.count,
    size: type.count,
    weight: 800,
    color: theme.text,
  })
  drawLine(paint, {
    text: text.countLabel,
    rect: blocks.countLabel,
    size: type.countLabel,
    weight: 600,
    color: theme.muted,
  })
  drawProgress(paint, content)
  layout.tiles.forEach((rect, index) => {
    const tile = text.tiles[index]
    if (tile) drawTile(paint, rect, tile)
  })
  drawLine(paint, {
    text: text.footer,
    rect: blocks.footer,
    size: type.footer,
    weight: 500,
    color: theme.muted,
  })
}

export const renderCard = async (format: ExportFormat, content: CardContent): Promise<Blob> => {
  const { width, height } = EXPORT_FORMATS[format]
  const context = createExportCanvas(width, height)
  const layout = layoutCard(format)
  const paint = { context, theme: readCssTokens(document.documentElement, THEME_TOKENS), layout }
  drawBackground(paint)
  drawText(paint, content)
  await drawWorldSnapshot(context, {
    projection: content.projection,
    visited: content.visited,
    wishlist: content.wishlist,
    rect: layout.map,
    borderWidth: EXPORT_BORDER_WIDTH_PX,
  })
  return toPngBlob(context.canvas)
}
