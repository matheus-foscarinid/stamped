import { readStorage, writeStorage } from '@/storage'
import { type CoverId, DEFAULT_COVER, isCoverId } from './cover-ids.ts'

export { COVER_IDS, type CoverId, DEFAULT_COVER } from './cover-ids.ts'

const COVER_STORAGE_KEY = 'stamped-cover'

export const readPickedCover = (): CoverId | null => {
  const stored = readStorage(COVER_STORAGE_KEY)
  return isCoverId(stored) ? stored : null
}

export const readStoredCover = (): CoverId => readPickedCover() ?? DEFAULT_COVER

export const storeCover = (cover: CoverId): void => writeStorage(COVER_STORAGE_KEY, cover)
