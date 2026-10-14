import { describe, expect, it } from 'vitest'
import { buildMachineLines } from './machine-lines.ts'

const SMALL_TRIP = { visited: ['br', 'ar', 'xk'] as const, continentCount: 2, unMemberCount: 1 }

describe('buildMachineLines', () => {
  it('spells the codes and each count in its own slot, padded with fillers', () => {
    expect(buildMachineLines(SMALL_TRIP)).toEqual([
      'P<STAMPED<<BR<AR<XK<<<<<<<<<<<<<<<<<<<<<<<<<',
      'V003<<C2<<UN001<<<<<<<<<<<<<<<<<<<<<<<<<<<<<',
    ])
  })

  it('keeps both lines at 44 characters, however many countries there are', () => {
    const visited = Array.from({ length: 40 }, () => 'fr' as const)
    for (const line of buildMachineLines({ ...SMALL_TRIP, visited })) {
      expect(line).toHaveLength(44)
    }
  })
})
