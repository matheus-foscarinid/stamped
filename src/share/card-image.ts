import { APP_NAME } from '@/brand/logo'
import type { CountryCode } from '@/countries'
import { drawWorldSnapshot, type ProjectionId } from '@/map'
import { readCssTokens } from '@/styles/css-tokens'
import { createExportCanvas, toPngBlob } from './canvas-export.ts'
import { type CardLayout, EXPORT_FORMATS, type ExportFormat, layoutCard } from './card-layout.ts'

const EXPORT_BORDER_WIDTH_PX = 1.2

const THEME_TOKENS = {
  background: '--surface',
  text: '--text',
  muted: '--text-muted',
  font: '--font',
}

type CardTheme = Record<keyof typeof THEME_TOKENS, string>

interface CardHeadline {
  title: string
  subtitle: string
}

export interface CardContent {
  projection: ProjectionId
  visited: readonly CountryCode[]
  headline: CardHeadline
}

const drawHeadline = (
  context: CanvasRenderingContext2D,
  { padding, title, subtitle, wordmark }: CardLayout,
  theme: CardTheme,
  headline: CardHeadline
) => {
  context.fillStyle = theme.text
  context.font = `600 ${title.size}px ${theme.font}`
  context.fillText(headline.title, padding, title.baseline)
  context.fillStyle = theme.muted
  context.font = `400 ${subtitle.size}px ${theme.font}`
  context.fillText(headline.subtitle, padding, subtitle.baseline)
  context.font = `650 ${wordmark.size}px ${theme.font}`
  context.fillText(APP_NAME, padding, wordmark.baseline)
}

export const renderCard = async (format: ExportFormat, content: CardContent): Promise<Blob> => {
  const { width, height } = EXPORT_FORMATS[format]
  const context = createExportCanvas(width, height)
  const layout = layoutCard(format)
  const theme = readCssTokens(document.documentElement, THEME_TOKENS)
  context.fillStyle = theme.background
  context.fillRect(0, 0, context.canvas.width, context.canvas.height)
  drawHeadline(context, layout, theme, content.headline)
  await drawWorldSnapshot(context, {
    projection: content.projection,
    visited: content.visited,
    rect: layout.map,
    borderWidth: EXPORT_BORDER_WIDTH_PX,
  })
  return toPngBlob(context.canvas)
}
