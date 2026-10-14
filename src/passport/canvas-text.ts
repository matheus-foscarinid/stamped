import type { ScreenRect } from '@/map'

// words that fit the width share a line. a word too long for any line gets its own
export const wrapLines = (
  text: string,
  maxWidth: number,
  measure: (line: string) => number
): string[] =>
  text
    .split(' ')
    .filter(word => word !== '')
    .reduce<string[]>((lines, word) => {
      const last = lines.at(-1)
      if (last !== undefined && measure(`${last} ${word}`) <= maxWidth) {
        return [...lines.slice(0, -1), `${last} ${word}`]
      }
      return [...lines, word]
    }, [])

interface SpacedText {
  text: string
  x: number
  y: number
  spacing: number
  align?: 'start' | 'end'
}

// spaces each letter by hand, since canvas letter spacing isn't in every browser yet
export const drawSpacedText = (
  context: CanvasRenderingContext2D,
  { text, x, y, spacing, align = 'start' }: SpacedText
) => {
  const characters = [...text]
  const widths = characters.map(character => context.measureText(character).width)
  const total = widths.reduce((sum, width) => sum + width + spacing, -spacing)
  let cursor = align === 'end' ? x - total : x
  characters.forEach((character, index) => {
    context.fillText(character, cursor, y)
    cursor += (widths[index] ?? 0) + spacing
  })
}

export const drawJustifiedLine = (
  context: CanvasRenderingContext2D,
  line: string,
  area: ScreenRect,
  y: number
) => {
  const characters = [...line]
  const lastWidth = context.measureText(characters.at(-1) ?? '').width
  const step = (area.width - lastWidth) / Math.max(1, characters.length - 1)
  characters.forEach((character, index) => {
    context.fillText(character, area.x + index * step, y)
  })
}
