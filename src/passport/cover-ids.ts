// no imports, the server uses it too
export const COVER_IDS = ['burgundy', 'navy', 'green', 'teal', 'black'] as const

export type CoverId = (typeof COVER_IDS)[number]

export const DEFAULT_COVER: CoverId = 'burgundy'

export const isCoverId = (value: unknown): value is CoverId => COVER_IDS.some(id => id === value)
