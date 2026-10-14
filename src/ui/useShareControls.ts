import { onScopeDispose, type Ref, ref } from 'vue'
import { type CountryCode, formatWorldShare } from '@/countries'
import { useI18n } from '@/i18n/useI18n'
import type { ProjectionId } from '@/map'
import { renderPassport } from '@/passport/passport-image'
import { PASSPORT_IMAGE } from '@/passport/passport-image-layout'
import { renderCard } from '@/share/card-image'
import { EXPORT_FORMAT_OPTIONS, type ExportFormat, formatImageSize } from '@/share/card-layout'
import { saveFile } from '@/share/save-file'
import { usePassportContent } from './usePassportContent'

const STATUS_DURATION_MS = 2500

type ImageChoice = ExportFormat | 'passport'

export const IMAGE_OPTIONS: { id: ImageChoice; size: string }[] = [
  ...EXPORT_FORMAT_OPTIONS,
  { id: 'passport', size: formatImageSize(PASSPORT_IMAGE) },
]

interface UseShareControlsInput {
  projection: () => ProjectionId
  visited: () => readonly CountryCode[]
}

interface UseShareControlsResult {
  status: Ref<string>
  isSaving: Ref<boolean>
  copyLink: () => Promise<void>
  saveImage: (choice: ImageChoice) => Promise<void>
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
  const passport = usePassportContent(input.visited)

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

  const renderMapCard = (format: ExportFormat) => {
    const visited = input.visited()
    return renderCard(format, {
      projection: input.projection(),
      visited,
      headline: describeVisits(visited.length),
    })
  }

  const renderPassportImage = () => {
    const { stamps, text } = passport.value
    return renderPassport({
      projection: input.projection(),
      visited: input.visited(),
      stamps,
      text,
    })
  }

  const saveImage = async (choice: ImageChoice) => {
    if (isSaving.value) return
    isSaving.value = true
    try {
      const blob = await (choice === 'passport' ? renderPassportImage() : renderMapCard(choice))
      const outcome = await saveFile(blob, `stamped-${choice}.png`)
      if (outcome === 'saved') show(t('share.imageSaved'))
    } catch {
      show(t('share.imageFailed'))
    } finally {
      isSaving.value = false
    }
  }

  return { status, isSaving, copyLink, saveImage }
}
