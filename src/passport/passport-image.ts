import { drawLogo } from '@/brand/draw-logo'
import { APP_NAME } from '@/brand/logo'
import { type CountryCode, getCountryHue } from '@/countries'
import { drawWorldSnapshot, type ProjectionId, type ScreenRect } from '@/map'
import { createExportCanvas, toPngBlob } from '@/share/canvas-export'
import { drawJustifiedLine, drawSpacedText, wrapLines } from '@/share/canvas-text'
import { readCssTokens } from '@/styles/css-tokens'
import {
  layoutPassportImage,
  PASSPORT_IMAGE,
  type PassportImageLayout,
} from './passport-image-layout.ts'
import { buildStampDataUrl } from './stamp-generator.ts'
import { getStampStyle } from './stamp-style.ts'

const MAP_BORDER_WIDTH_PX = 1.2
// a little room in each cell for the tilt
const STAMP_FILL = 0.86
const LOGO_SIZE = 40
const BOOK_RADIUS = { cover: 36, paper: 20 }
const FOLD = { width: 80, shade: 'rgb(0 0 0 / 0.16)' }
const ALPHA = { rule: 0.18, label: 0.6, machine: 0.5, empty: 0.7 }

const TYPE = {
  header: { weight: 700, size: 22, spacing: 5 },
  count: { weight: 800, size: 84 },
  countLabel: { weight: 600, size: 32, gap: 20 },
  statLabel: { weight: 700, size: 17, spacing: 1.4 },
  statValue: { weight: 700, size: 34 },
  machine: { weight: 600, size: 26, lineHeight: 34 },
  empty: { weight: 500, size: 30, lineHeight: 44 },
}

const THEME_TOKENS = {
  background: '--surface',
  font: '--font',
  monoFont: '--font-mono',
  cover: '--passport-cover-dark',
  paper: '--passport-paper',
  ink: '--passport-ink',
  visited: '--map-visited',
  stampLightness: '--stamp-lightness',
  stampBlend: '--stamp-blend',
  stampOpacity: '--stamp-opacity',
}

type PassportTheme = Record<keyof typeof THEME_TOKENS, string>

interface Paint {
  context: CanvasRenderingContext2D
  theme: PassportTheme
}

interface PassportStampText {
  code: CountryCode
  name: string
  continent: string
}

interface PassportPageText {
  title: string
  emptyText: string
  count: number
  countLabel: string
  statRows: { label: string; value: string }[]
  machineLines: readonly string[]
}

export interface PassportImageContent {
  projection: ProjectionId
  visited: readonly CountryCode[]
  stamps: readonly PassportStampText[]
  text: PassportPageText
}

interface Point {
  x: number
  y: number
}

const setFont = ({ context, theme }: Paint, { weight, size }: { weight: number; size: number }) => {
  context.font = `${weight} ${size}px ${theme.font}`
}

const withAlpha = ({ context }: Paint, alpha: number, draw: () => void) => {
  context.save()
  context.globalAlpha = alpha
  draw()
  context.restore()
}

const drawRule = (paint: Paint, { from, to, width }: { from: Point; to: Point; width: number }) => {
  withAlpha(paint, ALPHA.rule, () => {
    const { context } = paint
    context.lineWidth = width
    context.beginPath()
    context.moveTo(from.x, from.y)
    context.lineTo(to.x, to.y)
    context.stroke()
  })
}

const fillRoundedRect = ({ context }: Paint, rect: ScreenRect, radius: number) => {
  context.beginPath()
  context.roundRect(rect.x, rect.y, rect.width, rect.height, radius)
  context.fill()
}

const drawBook = (paint: Paint, layout: PassportImageLayout) => {
  const { context, theme } = paint
  context.fillStyle = theme.cover
  fillRoundedRect(paint, layout.book, BOOK_RADIUS.cover)
  const [left, right] = layout.pages
  const spread = { ...left, width: left.width + right.width }
  context.fillStyle = theme.paper
  fillRoundedRect(paint, spread, BOOK_RADIUS.paper)
  const foldStart = right.x - FOLD.width / 2
  const fold = context.createLinearGradient(foldStart, 0, foldStart + FOLD.width, 0)
  fold.addColorStop(0, 'transparent')
  fold.addColorStop(0.5, FOLD.shade)
  fold.addColorStop(1, 'transparent')
  context.fillStyle = fold
  context.fillRect(foldStart, spread.y, FOLD.width, spread.height)
}

const loadImage = (source: string): Promise<HTMLImageElement> => {
  const image = new Image()
  image.src = source
  return image.decode().then(() => image)
}

const loadStampImage = (stamp: PassportStampText, theme: PassportTheme) => {
  const color = `hsl(${getCountryHue(stamp.code)} 62% ${theme.stampLightness})`
  return loadImage(buildStampDataUrl({ ...stamp, color, font: theme.font }))
}

const drawStamp = (paint: Paint, image: HTMLImageElement, code: CountryCode, cell: ScreenRect) => {
  const { context, theme } = paint
  const size = cell.width * STAMP_FILL
  context.save()
  context.translate(cell.x + cell.width / 2, cell.y + cell.height / 2)
  context.rotate((getStampStyle(code).tiltDeg * Math.PI) / 180)
  context.globalAlpha = Number(theme.stampOpacity)
  if (theme.stampBlend === 'multiply') context.globalCompositeOperation = 'multiply'
  context.drawImage(image, -size / 2, -size / 2, size, size)
  context.restore()
}

const drawEmptyPage = (paint: Paint, area: ScreenRect, text: string) => {
  const { context, theme } = paint
  setFont(paint, TYPE.empty)
  context.fillStyle = theme.ink
  context.textAlign = 'center'
  const lines = wrapLines(text, area.width * 0.7, line => context.measureText(line).width)
  const top = area.y + area.height / 2 - (lines.length * TYPE.empty.lineHeight) / 2
  withAlpha(paint, ALPHA.empty, () => {
    lines.forEach((line, index) => {
      context.fillText(line, area.x + area.width / 2, top + index * TYPE.empty.lineHeight)
    })
  })
  context.textAlign = 'start'
}

const drawStampPage = async (
  paint: Paint,
  layout: PassportImageLayout,
  content: PassportImageContent
) => {
  if (content.stamps.length === 0) {
    drawEmptyPage(paint, layout.stampArea, content.text.emptyText)
    return
  }
  const images = await Promise.all(content.stamps.map(stamp => loadStampImage(stamp, paint.theme)))
  // drawn in order, so overlapping tilts stack the same way every time
  images.forEach((image, index) => {
    const stamp = content.stamps[index]
    const cell = layout.stampCells[index]
    if (stamp && cell) drawStamp(paint, image, stamp.code, cell)
  })
}

const drawHeader = (paint: Paint, area: ScreenRect, title: string) => {
  const { context, theme } = paint
  const baseline = area.y + 30
  const { spacing } = TYPE.header
  drawLogo(context, {
    x: area.x,
    y: area.y - 2,
    size: LOGO_SIZE,
    frame: theme.ink,
    globe: theme.visited,
  })
  context.fillStyle = theme.ink
  setFont(paint, TYPE.header)
  const nameX = area.x + LOGO_SIZE + 16
  drawSpacedText(context, { text: APP_NAME.toUpperCase(), x: nameX, y: baseline, spacing })
  const titleX = area.x + area.width
  drawSpacedText(context, {
    text: title.toLocaleUpperCase(),
    x: titleX,
    y: baseline,
    spacing,
    align: 'end',
  })
  const ruleY = area.y + area.height + 14
  drawRule(paint, { from: { x: area.x, y: ruleY }, to: { x: titleX, y: ruleY }, width: 1.5 })
}

const drawHeadline = (paint: Paint, area: ScreenRect, text: PassportPageText) => {
  const { context, theme } = paint
  const baseline = area.y + area.height - 10
  const count = String(text.count)
  context.fillStyle = theme.ink
  setFont(paint, TYPE.count)
  context.fillText(count, area.x, baseline)
  const labelX = area.x + context.measureText(count).width + TYPE.countLabel.gap
  setFont(paint, TYPE.countLabel)
  context.fillText(text.countLabel, labelX, baseline)
}

const drawStats = (paint: Paint, area: ScreenRect, text: PassportPageText) => {
  const { context } = paint
  const columnWidth = area.width / text.statRows.length
  text.statRows.forEach((row, index) => {
    const x = area.x + index * columnWidth
    drawRule(paint, { from: { x, y: area.y }, to: { x, y: area.y + area.height }, width: 3 })
    setFont(paint, TYPE.statLabel)
    withAlpha(paint, ALPHA.label, () => {
      const label = row.label.toLocaleUpperCase()
      drawSpacedText(context, {
        text: label,
        x: x + 18,
        y: area.y + 24,
        spacing: TYPE.statLabel.spacing,
      })
    })
    setFont(paint, TYPE.statValue)
    context.fillText(row.value, x + 18, area.y + area.height - 6)
  })
}

const drawMachineLines = (paint: Paint, area: ScreenRect, lines: readonly string[]) => {
  const { context, theme } = paint
  const right = area.x + area.width
  drawRule(paint, { from: { x: area.x, y: area.y }, to: { x: right, y: area.y }, width: 1.5 })
  context.font = `${TYPE.machine.weight} ${TYPE.machine.size}px ${theme.monoFont}`
  withAlpha(paint, ALPHA.machine, () => {
    lines.forEach((line, index) => {
      const y = area.y + 24 + (index + 1) * TYPE.machine.lineHeight
      drawJustifiedLine(context, line, area, y)
    })
  })
}

const drawDataPage = async (
  paint: Paint,
  layout: PassportImageLayout,
  content: PassportImageContent
) => {
  paint.context.strokeStyle = paint.theme.ink
  drawHeader(paint, layout.header, content.text.title)
  await drawWorldSnapshot(paint.context, {
    projection: content.projection,
    visited: content.visited,
    rect: layout.map,
    borderWidth: MAP_BORDER_WIDTH_PX,
  })
  drawHeadline(paint, layout.headline, content.text)
  drawStats(paint, layout.stats, content.text)
  drawMachineLines(paint, layout.machine, content.text.machineLines)
}

export const renderPassport = async (content: PassportImageContent): Promise<Blob> => {
  const context = createExportCanvas(PASSPORT_IMAGE.width, PASSPORT_IMAGE.height)
  const paint = { context, theme: readCssTokens(document.documentElement, THEME_TOKENS) }
  const layout = layoutPassportImage(content.stamps.length)
  context.fillStyle = paint.theme.background
  context.fillRect(0, 0, PASSPORT_IMAGE.width, PASSPORT_IMAGE.height)
  drawBook(paint, layout)
  await drawStampPage(paint, layout, content)
  await drawDataPage(paint, layout, content)
  return toPngBlob(context.canvas)
}
