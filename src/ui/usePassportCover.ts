import { type Ref, ref } from 'vue'
import { type CoverId, readStoredCover, storeCover } from '@/passport/covers'

interface UsePassportCoverResult {
  cover: Ref<CoverId>
  setCover: (cover: CoverId) => void
}

// on the root so exports read the same colours. index.html sets the saved one before the app loads
const applyCover = (cover: CoverId) => {
  document.documentElement.dataset.cover = cover
}

export const usePassportCover = (): UsePassportCoverResult => {
  const cover = ref<CoverId>(readStoredCover())
  const setCover = (next: CoverId) => {
    cover.value = next
    applyCover(next)
    storeCover(next)
  }
  return { cover, setCover }
}
