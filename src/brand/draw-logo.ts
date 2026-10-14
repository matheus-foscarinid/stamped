import { GLOBE_LINE_WIDTH, GLOBE_LINES_PATH, STAMP_PATH, STAMPED_CELL_PATH } from './logo.ts'

const VIEWBOX = 256
const TILT_RAD = (-15 * Math.PI) / 180

interface LogoPlacement {
  x: number
  y: number
  size: number
  frame: string
  globe: string
}

// the canvas twin of StampedLogo.vue, for exported images
export const drawLogo = (context: CanvasRenderingContext2D, logo: LogoPlacement) => {
  const center = VIEWBOX / 2
  context.save()
  context.translate(logo.x + logo.size / 2, logo.y + logo.size / 2)
  context.rotate(TILT_RAD)
  context.scale(logo.size / VIEWBOX, logo.size / VIEWBOX)
  context.translate(-center, -center)
  context.fillStyle = logo.frame
  context.fill(new Path2D(STAMP_PATH), 'evenodd')
  context.fillStyle = logo.globe
  context.fill(new Path2D(STAMPED_CELL_PATH))
  context.strokeStyle = logo.globe
  context.lineWidth = GLOBE_LINE_WIDTH
  context.lineCap = 'round'
  context.stroke(new Path2D(GLOBE_LINES_PATH))
  context.restore()
}
