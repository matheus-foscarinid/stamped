import { type CountryCode, getFlagEmoji } from '@/countries'
import { fitLabelSize, getStampStyle, type StampShape } from './stamp-style.ts'

// tilt and size are up to the caller
const STAMP_SIZE = 100
const CENTER = STAMP_SIZE / 2

export interface StampInput {
  code: CountryCode
  name: string
  continent: string
  // currentColor lets the page tint it
  color?: string
  font?: string
}

type StampOutline =
  | { kind: 'ring'; rx: number; ry: number; width: number }
  | { kind: 'polygon'; points: string; width: number }
  | { kind: 'rect'; inset: number; radius: number; width: number; isDotted?: boolean }

type StampLabels =
  | { kind: 'rim'; top: Radii; bottom: Radii }
  | { kind: 'line'; width: number; top: number; bottom: number }

interface Radii {
  rx: number
  ry: number
}

interface StampDesign {
  outlines: StampOutline[]
  labels: StampLabels
}

const ring = (rx: number, ry: number, width: number): StampOutline => ({
  kind: 'ring',
  rx,
  ry,
  width,
})

// straight labels sit inside the inner outline, which is narrower on a hexagon
const STAMP_DESIGNS: Record<StampShape, StampDesign> = {
  round: {
    outlines: [ring(47, 47, 2), ring(44.6, 44.6, 0.6), ring(30, 30, 0.9)],
    labels: { kind: 'rim', top: { rx: 35.5, ry: 35.5 }, bottom: { rx: 42, ry: 42 } },
  },
  oval: {
    outlines: [ring(48, 40, 2), ring(45.6, 37.6, 0.6), ring(33, 25, 0.9)],
    labels: { kind: 'rim', top: { rx: 37, ry: 29 }, bottom: { rx: 42, ry: 34 } },
  },
  hexagon: {
    outlines: [
      { kind: 'polygon', points: '27,6 73,6 97,50 73,94 27,94 3,50', width: 2 },
      { kind: 'polygon', points: '30.5,12 69.5,12 90,50 69.5,88 30.5,88 10,50', width: 0.9 },
    ],
    labels: { kind: 'line', width: 44, top: 23, bottom: 80 },
  },
  perforated: {
    outlines: [
      { kind: 'rect', inset: 4, radius: 3, width: 2.6, isDotted: true },
      { kind: 'rect', inset: 10, radius: 2, width: 1.4 },
      { kind: 'rect', inset: 13.5, radius: 1, width: 0.6 },
    ],
    labels: { kind: 'line', width: 62, top: 25, bottom: 81 },
  },
}

// the arcs are longer than this, but text near their ends runs into the ring
const RIM_LABEL_WIDTH = 76
// a near-zero dash with a round cap draws a dot every 4.6 units
const PERFORATION = 'stroke-linecap="round" stroke-dasharray="0.01 4.6"'
const LABEL_ATTRIBUTES = 'font-weight="800" letter-spacing="0.06em"'
const STAR_X = [12.5, 87.5]
const FLAG = { y: 47, size: 30 }
const CODE = { y: 70, size: 8.5 }

const escapeXml = (text: string): string =>
  text.replace(/[&<>"]/g, character => `&#${character.charCodeAt(0)};`)

const formatLabel = (text: string): string => escapeXml(text.toLocaleUpperCase())

const drawOutline = (outline: StampOutline): string => {
  if (outline.kind === 'ring') {
    return `<ellipse cx="${CENTER}" cy="${CENTER}" rx="${outline.rx}" ry="${outline.ry}" stroke-width="${outline.width}"/>`
  }
  if (outline.kind === 'polygon') {
    return `<polygon points="${outline.points}" stroke-width="${outline.width}" stroke-linejoin="round"/>`
  }
  const side = STAMP_SIZE - outline.inset * 2
  const dots = outline.isDotted ? ` ${PERFORATION}` : ''
  return `<rect x="${outline.inset}" y="${outline.inset}" width="${side}" height="${side}" rx="${outline.radius}" stroke-width="${outline.width}"${dots}/>`
}

const arcPath = ({ rx, ry }: Radii, sweep: 0 | 1): string =>
  `M ${CENTER - rx} ${CENTER} A ${rx} ${ry} 0 0 ${sweep} ${CENTER + rx} ${CENTER}`

const drawRimLabels = (
  arcs: { top: Radii; bottom: Radii },
  { code, name, continent }: StampInput
): string => {
  const topId = `${code}-stamp-top`
  const bottomId = `${code}-stamp-bottom`
  const label = (text: string, id: string) =>
    `<text ${LABEL_ATTRIBUTES} font-size="${fitLabelSize(text, RIM_LABEL_WIDTH)}"><textPath href="#${id}" startOffset="50%">${formatLabel(text)}</textPath></text>`
  const stars = STAR_X.map(
    x => `<text x="${x}" y="${CENTER}" font-size="6" dominant-baseline="central">★</text>`
  ).join('')
  return `<defs><path id="${topId}" d="${arcPath(arcs.top, 1)}"/><path id="${bottomId}" d="${arcPath(arcs.bottom, 0)}"/></defs>${label(name, topId)}${label(continent, bottomId)}${stars}`
}

const drawLineLabels = (
  lines: { width: number; top: number; bottom: number },
  { name, continent }: StampInput
): string => {
  const label = (text: string, y: number) =>
    `<text x="${CENTER}" y="${y}" ${LABEL_ATTRIBUTES} font-size="${fitLabelSize(text, lines.width)}">${formatLabel(text)}</text>`
  return label(name, lines.top) + label(continent, lines.bottom)
}

const drawLabels = (labels: StampLabels, input: StampInput): string =>
  labels.kind === 'rim' ? drawRimLabels(labels, input) : drawLineLabels(labels, input)

// one svg for the page and exports
export const buildStampSvg = (input: StampInput): string => {
  const design = STAMP_DESIGNS[getStampStyle(input.code).shape]
  const color = escapeXml(input.color ?? 'currentColor')
  const font = input.font ? ` font-family="${escapeXml(input.font)}"` : ''
  const outlines = design.outlines.map(drawOutline).join('')
  const flag = `<text x="${CENTER}" y="${FLAG.y}" font-size="${FLAG.size}" dominant-baseline="central">${getFlagEmoji(input.code)}</text>`
  const code = `<text x="${CENTER}" y="${CODE.y}" font-size="${CODE.size}" font-weight="800" letter-spacing="0.32em">${input.code.toUpperCase()}</text>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${STAMP_SIZE} ${STAMP_SIZE}"><title>${escapeXml(input.name)}</title><g fill="none" stroke="${color}">${outlines}</g><g fill="${color}" stroke="none" text-anchor="middle"${font}>${drawLabels(design.labels, input)}${flag}${code}</g></svg>`
}

export const buildStampDataUrl = (input: StampInput): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildStampSvg(input))}`
