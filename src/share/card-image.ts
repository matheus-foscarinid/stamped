import { COUNTRY_CODES, type CountryCode } from '@/countries'
import { drawWorldSnapshot, type ProjectionId } from '@/map'
import { readCssTokens } from '@/styles/css-tokens'
import { type CardLayout, EXPORT_FORMATS, type ExportFormat, layoutCard } from './card-layout.ts'

const EXPORT_BORDER_WIDTH_PX = 1.2
const APP_NAME = 'Stamped'

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
}

const formatWorldShare = (visitedCount: number): string => {
  const percent = Math.round((visitedCount / COUNTRY_CODES.length) * 100)
  if (percent === 0 && visitedCount > 0) return '<1%'
  return `${percent}%`
}

export const describeVisits = (visitedCount: number): CardHeadline => {
  const noun = visitedCount === 1 ? 'country' : 'countries'
  return {
    title: `${visitedCount} ${noun} visited`,
    subtitle: `${formatWorldShare(visitedCount)} of the world`,
  }
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

const createCanvas = (format: ExportFormat): CanvasRenderingContext2D => {
  const canvas = document.createElement('canvas')
  canvas.width = EXPORT_FORMATS[format].width
  canvas.height = EXPORT_FORMATS[format].height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas 2d context unavailable')
  return context
}

const toPngBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('could not encode the image'))),
      'image/png'
    )
  })

export const renderCard = async (format: ExportFormat, content: CardContent): Promise<Blob> => {
  const context = createCanvas(format)
  const layout = layoutCard(format)
  const theme = readCssTokens(document.documentElement, THEME_TOKENS)
  context.fillStyle = theme.background
  context.fillRect(0, 0, context.canvas.width, context.canvas.height)
  drawHeadline(context, layout, theme, describeVisits(content.visited.length))
  await drawWorldSnapshot(context, {
    projection: content.projection,
    visited: content.visited,
    rect: layout.map,
    borderWidth: EXPORT_BORDER_WIDTH_PX,
  })
  return toPngBlob(context.canvas)
}
