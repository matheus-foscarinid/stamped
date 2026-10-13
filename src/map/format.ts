// binary layout shared by build/encode.ts and src/map/decode.ts. change both together
//   magic "TMAP" | version u8 | width | height | country count
//   per country: ring count, then per ring: point count + zigzag varint deltas (x, y)
// deltas carry over between rings and countries, so only the very first point is absolute

export const MAP_MAGIC = 'TMAP'
export const MAP_FORMAT_VERSION = 1

export interface CountryShape {
  // flat x0, y0, x1, y1... in grid units. rings close implicitly
  rings: Int16Array[]
}

export interface MapGeometry {
  width: number
  height: number
  countries: CountryShape[]
}

// last point written or read. every point is stored relative to it
export interface DeltaCursor {
  x: number
  y: number
}

export interface ByteReader {
  bytes: Uint8Array
  offset: number
}

export const zigzagEncode = (value: number): number => (value << 1) ^ (value >> 31)

export const zigzagDecode = (value: number): number => (value >>> 1) ^ -(value & 1)

export const writeVarint = (bytes: number[], value: number): void => {
  let rest = value >>> 0
  while (rest >= 0x80) {
    bytes.push((rest & 0x7f) | 0x80)
    rest >>>= 7
  }
  bytes.push(rest)
}

export const readByte = (reader: ByteReader): number => {
  const byte = reader.bytes[reader.offset]
  if (byte === undefined) throw new Error(`map data truncated at byte ${reader.offset}`)
  reader.offset += 1
  return byte
}

export const readVarint = (reader: ByteReader): number => {
  let value = 0
  let shift = 0
  let byte = 0x80
  while (byte & 0x80) {
    byte = readByte(reader)
    value |= (byte & 0x7f) << shift
    shift += 7
  }
  return value >>> 0
}
