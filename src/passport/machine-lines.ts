import type { CountryCode } from '@/countries'

const LINE_LENGTH = 44
const FILLER = '<'

interface MachineLinesInput {
  visited: readonly CountryCode[]
  continentCount: number
  unMemberCount: number
}

const fitLine = (text: string): string => text.slice(0, LINE_LENGTH).padEnd(LINE_LENGTH, FILLER)

const padCount = (count: number): string => String(count).padStart(3, '0')

export const buildMachineLines = ({
  visited,
  continentCount,
  unMemberCount,
}: MachineLinesInput): [string, string] => [
  fitLine(`P<STAMPED<<${visited.map(code => code.toUpperCase()).join(FILLER)}`),
  fitLine(`V${padCount(visited.length)}<<C${continentCount}<<UN${padCount(unMemberCount)}<<`),
]
