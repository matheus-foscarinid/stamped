import { onScopeDispose, type Ref, ref } from 'vue'
import { type CountryCode, formatWorldShare } from '@/countries'
import { useI18n } from '@/i18n/useI18n'
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
  const { language, t } = useI18n()
  const isSaving = ref(false)

  const describeVisits = (count: number) => ({
    title: t('card.title', { count }),
    subtitle: t('card.subtitle', { share: formatWorldShare(count, language.value) }),
  })

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      show(t('share.linkCopied'))
    } catch {
      show(t('share.copyBlocked'))
    }
  }

  const saveImage = async (format: ExportFormat) => {
    if (isSaving.value) return
    isSaving.value = true
    try {
      const visited = input.visited()
      const blob = await renderCard(format, {
        projection: input.projection(),
        visited,
        headline: describeVisits(visited.length),
      })
      const outcome = await saveFile(blob, `stamped-${format}.png`)
      if (outcome === 'saved') show(t('share.imageSaved'))
    } catch {
      show(t('share.imageFailed'))
    } finally {
      isSaving.value = false
    }
  }

  return { status, isSaving, copyLink, saveImage }
}
