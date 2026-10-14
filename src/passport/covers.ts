export const COVER_IDS = ['burgundy', 'navy', 'green', 'teal', 'black'] as const

export type CoverId = (typeof COVER_IDS)[number]

export const DEFAULT_COVER: CoverId = 'burgundy'

const COVER_STORAGE_KEY = 'stamped-cover'

const isCoverId = (value: unknown): value is CoverId => COVER_IDS.some(id => id === value)

export const readStoredCover = (): CoverId => {
  try {
    const stored = localStorage.getItem(COVER_STORAGE_KEY)
    return isCoverId(stored) ? stored : DEFAULT_COVER
  } catch {
    return DEFAULT_COVER
  }
}

export const storeCover = (cover: CoverId): void => {
  try {
    localStorage.setItem(COVER_STORAGE_KEY, cover)
  } catch {
    // the cover stays for this visit only
  }
}
