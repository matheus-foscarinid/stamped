import {
  type CountryShape,
  type DeltaCursor,
  MAP_FORMAT_VERSION,
  MAP_MAGIC,
  type MapGeometry,
  writeVarint,
  zigzagEncode,
} from '../src/map/format.ts'

const writeRing = (bytes: number[], ring: Int16Array, cursor: DeltaCursor): void => {
  writeVarint(bytes, ring.length / 2)
  for (let index = 0; index < ring.length; index += 2) {
    const x = ring[index] ?? 0
    const y = ring[index + 1] ?? 0
    writeVarint(bytes, zigzagEncode(x - cursor.x))
    writeVarint(bytes, zigzagEncode(y - cursor.y))
    cursor.x = x
    cursor.y = y
  }
}

const writeCountry = (bytes: number[], country: CountryShape, cursor: DeltaCursor): void => {
  writeVarint(bytes, country.rings.length)
  for (const ring of country.rings) writeRing(bytes, ring, cursor)
}

export const encodeMap = (geometry: MapGeometry): Uint8Array => {
  const bytes = [...MAP_MAGIC].map(char => char.charCodeAt(0))
  bytes.push(MAP_FORMAT_VERSION)
  writeVarint(bytes, geometry.width)
  writeVarint(bytes, geometry.height)
  writeVarint(bytes, geometry.countries.length)
  const cursor: DeltaCursor = { x: 0, y: 0 }
  for (const country of geometry.countries) writeCountry(bytes, country, cursor)
  return Uint8Array.from(bytes)
}
