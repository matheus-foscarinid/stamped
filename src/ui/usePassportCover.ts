import { type Ref, ref, watch } from 'vue'
import { type CoverId, readStoredCover, storeCover } from '@/passport/covers'

interface UsePassportCoverResult {
  cover: Ref<CoverId>
  setCover: (cover: CoverId) => void
}

// on the root, like the theme, so exported passports read the same colours
const applyCover = (cover: CoverId) => {
  document.documentElement.dataset.cover = cover
}

export const usePassportCover = (): UsePassportCoverResult => {
  const cover = ref<CoverId>(readStoredCover())
  watch(cover, applyCover, { immediate: true })
  const setCover = (next: CoverId) => {
    cover.value = next
    storeCover(next)
  }
  return { cover, setCover }
}
