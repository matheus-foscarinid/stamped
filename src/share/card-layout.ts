import type { ScreenRect } from '@/map'

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

export const EXPORT_FORMAT_OPTIONS: ExportFormatOption[] = EXPORT_FORMAT_IDS.map(id => {
  const { width, height } = EXPORT_FORMATS[id]
  return { id, size: `${width} × ${height}` }
})

const PADDING_RATIO = 0.07
const TITLE_RATIO = 0.08
const SUBTITLE_RATIO = 0.4
const SUBTITLE_LINE_HEIGHT = 1.8

interface TextLine {
  size: number
  baseline: number
}

export interface CardLayout {
  padding: number
  title: TextLine
  subtitle: TextLine
  wordmark: TextLine
  map: ScreenRect
}

export const layoutCard = (format: ExportFormat): CardLayout => {
  const { width, height, safeInset } = EXPORT_FORMATS[format]
  const shortSide = Math.min(width, height)
  const padding = Math.round(shortSide * PADDING_RATIO)
  const inset = safeInset ?? padding
  const titleSize = Math.round(shortSide * TITLE_RATIO)
  const subtitleSize = Math.round(titleSize * SUBTITLE_RATIO)
  const title = { size: titleSize, baseline: inset + titleSize }
  const subtitleGap = Math.round(subtitleSize * SUBTITLE_LINE_HEIGHT)
  const subtitle = { size: subtitleSize, baseline: title.baseline + subtitleGap }
  const wordmark = { size: subtitleSize, baseline: height - inset }
  const mapTop = subtitle.baseline + padding
  const mapBottom = wordmark.baseline - wordmark.size - padding / 2
  const map = { x: padding, y: mapTop, width: width - padding * 2, height: mapBottom - mapTop }
  return { padding, title, subtitle, wordmark, map }
}
