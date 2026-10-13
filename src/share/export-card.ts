import type { CountryCode } from '@/countries'
import { drawWorldSnapshot, type ProjectionId } from '@/map'
import {
  type CardHeadline,
  describeVisits,
  EXPORT_FORMATS,
  type ExportFormat,
  layoutCard,
} from './card-layout.ts'

const BORDER_WIDTH_PX = 1.2

interface CardTheme {
  background: string
  text: string
  muted: string
  font: string
}

export interface CardContent {
  projection: ProjectionId
  visited: readonly CountryCode[]
}

// tokens live in css, so the image follows whichever theme is on the page
const readCardTheme = (): CardTheme => {
  const style = getComputedStyle(document.body)
  const read = (name: string) => style.getPropertyValue(name).trim()
  return {
    background: read('--export-bg'),
    text: read('--export-text'),
    muted: read('--export-muted'),
    font: style.fontFamily,
  }
}

const drawHeadline = (
  context: CanvasRenderingContext2D,
  format: ExportFormat,
  theme: CardTheme,
  headline: CardHeadline
) => {
  const { padding, title, subtitle } = layoutCard(format)
  context.fillStyle = theme.text
  context.font = `600 ${title.size}px ${theme.font}`
  context.fillText(headline.title, padding, title.baseline)
  context.fillStyle = theme.muted
  context.font = `400 ${subtitle.size}px ${theme.font}`
  context.fillText(headline.subtitle, padding, subtitle.baseline)
}

const toPngBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('could not encode the image'))),
      'image/png'
    )
  })

export const renderCard = async (format: ExportFormat, content: CardContent): Promise<Blob> => {
  const { width, height } = EXPORT_FORMATS[format]
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas 2d context unavailable')
  const theme = readCardTheme()
  context.fillStyle = theme.background
  context.fillRect(0, 0, width, height)
  drawHeadline(context, format, theme, describeVisits(content.visited.length))
  await drawWorldSnapshot(context, {
    projection: content.projection,
    visited: content.visited,
    rect: layoutCard(format).map,
    borderWidth: BORDER_WIDTH_PX,
  })
  return toPngBlob(canvas)
}
