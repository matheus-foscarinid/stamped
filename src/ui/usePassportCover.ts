import { type Ref, ref } from 'vue'
import { bindAccountPreference, syncPreference } from '@/account/account'
import { type CoverId, readPickedCover, readStoredCover, storeCover } from '@/passport/covers'

interface UsePassportCoverResult {
  cover: Ref<CoverId>
  setCover: (cover: CoverId) => void
}

// on the root so exports read the same colours. index.html sets the saved one before the app loads
const applyCover = (cover: CoverId) => {
  document.documentElement.dataset.cover = cover
}

// one cover for the page, so the account's pick lands before the passport ever opens
const cover = ref<CoverId>(readStoredCover())

const setCover = (next: CoverId) => {
  cover.value = next
  applyCover(next)
  storeCover(next)
  syncPreference('cover', next)
}

bindAccountPreference('cover', { readStored: readPickedCover, show: setCover })

export const usePassportCover = (): UsePassportCoverResult => ({ cover, setCover })
