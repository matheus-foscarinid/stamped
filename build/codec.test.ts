import { describe, expect, it } from 'vitest'
import { decodeMap } from '../src/map/decode.ts'
import type { MapGeometry } from '../src/map/format.ts'
import { encodeMap } from './encode.ts'

const TWO_COUNTRIES: MapGeometry = {
  width: 4096,
  height: 2100,
  countries: [
    {
      rings: [
        Int16Array.from([0, 0, 4095, 0, 4095, 2099]),
        Int16Array.from([10, 10, 9, 12, 11, 8]),
      ],
    },
    { rings: [] },
    { rings: [Int16Array.from([3000, 1500, 2990, 1520, 3010, 1490, 2000, 100])] },
  ],
}

const toBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer

describe('map codec', () => {
  it('decodes exactly what was encoded, including empty countries and big jumps', () => {
    expect(decodeMap(toBuffer(encodeMap(TWO_COUNTRIES)))).toEqual(TWO_COUNTRIES)
  })

  it('stores small moves in one byte per coordinate', () => {
    const tinySteps: MapGeometry = {
      width: 100,
      height: 100,
      countries: [{ rings: [Int16Array.from([0, 0, 1, 1, 2, 0, 1, -1])] }],
    }
    const headerBytes = 4 + 1 + 1 + 1 + 1 + 1 + 1
    expect(encodeMap(tinySteps).length).toBe(headerBytes + 8)
  })

  it('rejects files that are not maps or use another format version', () => {
    const encoded = encodeMap(TWO_COUNTRIES)
    const wrongVersion = Uint8Array.from(encoded)
    wrongVersion[4] = 99
    expect(() => decodeMap(toBuffer(Uint8Array.from([1, 2, 3, 4, 5])))).toThrow('not a map file')
    expect(() => decodeMap(toBuffer(wrongVersion))).toThrow('unsupported map format v99')
  })

  it('fails loudly on a truncated file instead of returning partial shapes', () => {
    const encoded = encodeMap(TWO_COUNTRIES)
    expect(() => decodeMap(toBuffer(encoded.subarray(0, encoded.length - 3)))).toThrow(
      'map data truncated'
    )
  })
})
