import { type MaybeRefOrGetter, onScopeDispose, type Ref, ref, toValue } from 'vue'
import type { CountryCode } from '@/countries'
import type { ProjectionId } from '@/map'
import type { ExportFormat } from '@/share/card-layout'
import { downloadBlob, renderCard } from '@/share/export-card'

const STATUS_DURATION_MS = 2500

interface UseShareControlsInput {
  projection: MaybeRefOrGetter<ProjectionId>
  visited: MaybeRefOrGetter<readonly CountryCode[]>
}

interface UseShareControlsResult {
  status: Ref<string>
  isSaving: Ref<boolean>
  copyLink: () => Promise<void>
  saveImage: (format: ExportFormat) => Promise<void>
}

const useFlashMessage = () => {
  const status = ref('')
  let timer: ReturnType<typeof setTimeout> | undefined
  const flash = (message: string) => {
    status.value = message
    clearTimeout(timer)
    timer = setTimeout(() => {
      status.value = ''
    }, STATUS_DURATION_MS)
  }
  onScopeDispose(() => clearTimeout(timer))
  return { status, flash }
}

export const useShareControls = ({
  projection,
  visited,
}: UseShareControlsInput): UseShareControlsResult => {
  const { status, flash } = useFlashMessage()
  const isSaving = ref(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      flash('Link copied')
    } catch {
      flash('Copy blocked. The address bar has your link')
    }
  }

  const saveImage = async (format: ExportFormat) => {
    if (isSaving.value) return
    isSaving.value = true
    try {
      const blob = await renderCard(format, {
        projection: toValue(projection),
        visited: toValue(visited),
      })
      downloadBlob(blob, `travel-map-${format}.png`)
      flash('Image saved')
    } catch {
      flash('Could not create the image. Try again')
    } finally {
      isSaving.value = false
    }
  }

  return { status, isSaving, copyLink, saveImage }
}
