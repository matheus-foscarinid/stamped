import { onScopeDispose, type Ref, ref } from 'vue'
import type { CountryCode } from '@/countries'
import type { ProjectionId } from '@/map'
import { renderCard } from '@/share/card-image'
import type { ExportFormat } from '@/share/card-layout'
import { saveFile } from '@/share/save-file'

const STATUS_DURATION_MS = 2500

interface UseShareControlsInput {
  projection: () => ProjectionId
  visited: () => readonly CountryCode[]
}

interface UseShareControlsResult {
  status: Ref<string>
  isSaving: Ref<boolean>
  copyLink: () => Promise<void>
  saveImage: (format: ExportFormat) => Promise<void>
}

interface StatusMessage {
  status: Ref<string>
  show: (message: string) => void
}

const useStatusMessage = (): StatusMessage => {
  const status = ref('')
  let timer: ReturnType<typeof setTimeout> | undefined
  const show = (message: string) => {
    status.value = message
    clearTimeout(timer)
    timer = setTimeout(() => {
      status.value = ''
    }, STATUS_DURATION_MS)
  }
  onScopeDispose(() => clearTimeout(timer))
  return { status, show }
}

export const useShareControls = (input: UseShareControlsInput): UseShareControlsResult => {
  const { status, show } = useStatusMessage()
  const isSaving = ref(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      show('Link copied')
    } catch {
      show('Copy blocked. The address bar has your link')
    }
  }

  const saveImage = async (format: ExportFormat) => {
    if (isSaving.value) return
    isSaving.value = true
    try {
      const blob = await renderCard(format, {
        projection: input.projection(),
        visited: input.visited(),
      })
      const outcome = await saveFile(blob, `travel-map-${format}.png`)
      if (outcome === 'saved') show('Image saved')
    } catch {
      show('Could not create the image. Try again')
    } finally {
      isSaving.value = false
    }
  }

  return { status, isSaving, copyLink, saveImage }
}
