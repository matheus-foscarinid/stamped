interface Point {
  x: number
  y: number
}

const at = (points: number[], index: number): Point => ({
  x: points[index * 2] ?? 0,
  y: points[index * 2 + 1] ?? 0,
})

const distanceToSegment = (point: Point, start: Point, end: Point): number => {
  const length = Math.hypot(end.x - start.x, end.y - start.y)
  if (length === 0) return Math.hypot(point.x - start.x, point.y - start.y)
  const cross = (end.x - start.x) * (start.y - point.y) - (start.x - point.x) * (end.y - start.y)
  return Math.abs(cross) / length
}

const findFarthest = (points: number[], start: number, end: number) => {
  const [startPoint, endPoint] = [at(points, start), at(points, end)]
  let farthest = { index: -1, distance: 0 }
  for (let index = start + 1; index < end; index++) {
    const distance = distanceToSegment(at(points, index), startPoint, endPoint)
    if (distance > farthest.distance) farthest = { index, distance }
  }
  return farthest
}

// douglas-peucker on flat x, y pairs. a stack instead of recursion, since coastlines run long
export const simplifyLine = (points: number[], tolerance: number): number[] => {
  const count = points.length / 2
  if (count < 3) return points
  const isKept = new Uint8Array(count)
  isKept[0] = 1
  isKept[count - 1] = 1
  const spans: [number, number][] = [[0, count - 1]]
  while (spans.length > 0) {
    const [start, end] = spans.pop() ?? [0, 0]
    const farthest = findFarthest(points, start, end)
    if (farthest.distance <= tolerance) continue
    isKept[farthest.index] = 1
    spans.push([start, farthest.index], [farthest.index, end])
  }
  return points.filter((_, value) => isKept[Math.floor(value / 2)] === 1)
}
