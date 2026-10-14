import { onScopeDispose, type Ref, ref } from 'vue'
import { COUNTRY_CODES, type CountryCode, getTravelStats } from '@/countries'
import { useI18n } from '@/i18n/useI18n'
import type { ProjectionId } from '@/map'
import { renderPassport } from '@/passport/passport-image'
import { PASSPORT_IMAGE } from '@/passport/passport-image-layout'
import { type CardText, renderCard } from '@/share/card-image'
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
  wishlist: () => readonly CountryCode[]
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

// the card's words, in the page language. the footer links back to wherever this copy is hosted
const useCardText = () => {
  const { language, t } = useI18n()
  return (visited: readonly CountryCode[]): CardText => {
    const stats = getTravelStats(visited, language.value)
    const count = visited.length
    return {
      eyebrow: t('card.eyebrow'),
      count: String(count),
      countLabel: t('passport.countriesVisited', { count }),
      progressLabel: t('card.progress', { count, total: COUNTRY_CODES.length }),
      share: stats.worldShare,
      tiles: [
        { value: `${stats.unMemberCount}/${stats.unMemberTotal}`, label: t('stats.unMembers') },
        {
          value: `${stats.continents.length}/${stats.continentTotal}`,
          label: t('stats.continents'),
        },
      ],
      footer: t('card.footer', { link: window.location.host }),
    }
  }
}

export const useShareControls = (input: UseShareControlsInput): UseShareControlsResult => {
  const { status, show } = useStatusMessage()
  const { t } = useI18n()
  const describeCard = useCardText()
  const isSaving = ref(false)
  const passport = usePassportContent(input.visited)

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
      wishlist: input.wishlist(),
      progress: visited.length / COUNTRY_CODES.length,
      text: describeCard(visited),
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
