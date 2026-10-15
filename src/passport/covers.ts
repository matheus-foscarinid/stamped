import { readStorage, writeStorage } from '@/storage'

export const COVER_IDS = ['burgundy', 'navy', 'green', 'teal', 'black'] as const

export type CoverId = (typeof COVER_IDS)[number]

export const DEFAULT_COVER: CoverId = 'burgundy'

const COVER_STORAGE_KEY = 'stamped-cover'

const isCoverId = (value: unknown): value is CoverId => COVER_IDS.some(id => id === value)

export const readStoredCover = (): CoverId => {
  const stored = readStorage(COVER_STORAGE_KEY)
  return isCoverId(stored) ? stored : DEFAULT_COVER
}

export const storeCover = (cover: CoverId): void => writeStorage(COVER_STORAGE_KEY, cover)
