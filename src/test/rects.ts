import type { ScreenRect } from '@/map'

const TOLERANCE = 0.01

export const isInside = (inner: ScreenRect, outer: ScreenRect) =>
  inner.x >= outer.x - TOLERANCE &&
  inner.y >= outer.y - TOLERANCE &&
  inner.x + inner.width <= outer.x + outer.width + TOLERANCE &&
  inner.y + inner.height <= outer.y + outer.height + TOLERANCE

export const overlaps = (a: ScreenRect, b: ScreenRect) =>
  a.x < b.x + b.width - TOLERANCE &&
  b.x < a.x + a.width - TOLERANCE &&
  a.y < b.y + b.height - TOLERANCE &&
  b.y < a.y + a.height - TOLERANCE
