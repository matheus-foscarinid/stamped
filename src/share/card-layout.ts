import { COUNTRY_CODES } from '@/countries'
import type { ScreenRect } from '@/map'

export const EXPORT_FORMATS = {
  post: { label: 'Post', width: 1080, height: 1350 },
  story: { label: 'Story', width: 1080, height: 1920 },
  wide: { label: 'Wide', width: 1200, height: 630 },
} as const

export type ExportFormat = keyof typeof EXPORT_FORMATS

export const EXPORT_FORMAT_IDS = Object.keys(EXPORT_FORMATS) as ExportFormat[]

// stories put the profile bar and reply box over the top and bottom of the image
const STORY_SAFE_INSET = 250
const PADDING_RATIO = 0.07
const TITLE_RATIO = 0.08
const SUBTITLE_RATIO = 0.4

interface TextLine {
  size: number
  baseline: number
}

export interface CardLayout {
  padding: number
  title: TextLine
  subtitle: TextLine
  map: ScreenRect
}

export const layoutCard = (format: ExportFormat): CardLayout => {
  const { width, height } = EXPORT_FORMATS[format]
  const shortSide = Math.min(width, height)
  const padding = Math.round(shortSide * PADDING_RATIO)
  const inset = format === 'story' ? STORY_SAFE_INSET : padding
  const titleSize = Math.round(shortSide * TITLE_RATIO)
  const subtitleSize = Math.round(titleSize * SUBTITLE_RATIO)
  const title = { size: titleSize, baseline: inset + titleSize }
  const subtitle = { size: subtitleSize, baseline: title.baseline + Math.round(subtitleSize * 1.8) }
  const mapTop = subtitle.baseline + padding
  const map = { x: padding, y: mapTop, width: width - padding * 2, height: height - inset - mapTop }
  return { padding, title, subtitle, map }
}

export interface CardHeadline {
  title: string
  subtitle: string
}

export const describeVisits = (visitedCount: number): CardHeadline => {
  const noun = visitedCount === 1 ? 'country' : 'countries'
  const share = Math.round((visitedCount / COUNTRY_CODES.length) * 100)
  return { title: `${visitedCount} ${noun} visited`, subtitle: `${share}% of the world` }
}
