import {
  type ByteReader,
  type CountryShape,
  type DeltaCursor,
  MAP_FORMAT_VERSION,
  MAP_MAGIC,
  type MapGeometry,
  readByte,
  readVarint,
  zigzagDecode,
} from './format.ts'

const assertHeader = (reader: ByteReader): void => {
  const magic = String.fromCharCode(...reader.bytes.subarray(0, MAP_MAGIC.length))
  if (magic !== MAP_MAGIC) throw new Error('not a map file')
  reader.offset = MAP_MAGIC.length
  const version = readByte(reader)
  if (version !== MAP_FORMAT_VERSION) throw new Error(`unsupported map format v${version}`)
}

const readRing = (reader: ByteReader, cursor: DeltaCursor): Int16Array => {
  const ring = new Int16Array(readVarint(reader) * 2)
  for (let index = 0; index < ring.length; index += 2) {
    cursor.x += zigzagDecode(readVarint(reader))
    cursor.y += zigzagDecode(readVarint(reader))
    ring[index] = cursor.x
    ring[index + 1] = cursor.y
  }
  return ring
}

const readCountry = (reader: ByteReader, cursor: DeltaCursor): CountryShape => {
  const ringCount = readVarint(reader)
  return { rings: Array.from({ length: ringCount }, () => readRing(reader, cursor)) }
}

export const decodeMap = (buffer: ArrayBuffer): MapGeometry => {
  const reader: ByteReader = { bytes: new Uint8Array(buffer), offset: 0 }
  assertHeader(reader)
  const width = readVarint(reader)
  const height = readVarint(reader)
  const countryCount = readVarint(reader)
  const cursor: DeltaCursor = { x: 0, y: 0 }
  const countries = Array.from({ length: countryCount }, () => readCountry(reader, cursor))
  return { width, height, countries }
}
