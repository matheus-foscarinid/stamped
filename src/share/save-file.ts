// ios reads the blob only after the user confirms the download, so revoking early breaks it
const REVOKE_DELAY_MS = 40_000

export type SaveOutcome = 'saved' | 'cancelled'

type ShareOutcome = SaveOutcome | 'unsupported'

const isTouchDevice = (): boolean => window.matchMedia('(pointer: coarse)').matches

const isCancelled = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError'

// phones keep photos through the share sheet. a download link there only opens a preview
const shareFile = async (file: File): Promise<ShareOutcome> => {
  if (!isTouchDevice() || !('canShare' in navigator) || !navigator.canShare({ files: [file] })) {
    return 'unsupported'
  }
  try {
    await navigator.share({ files: [file] })
    return 'saved'
  } catch (error) {
    // anything but a cancel, like a lapsed user gesture, falls back to the download link
    return isCancelled(error) ? 'cancelled' : 'unsupported'
  }
}

const downloadFile = (file: File): void => {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS)
}

export const saveFile = async (blob: Blob, fileName: string): Promise<SaveOutcome> => {
  const file = new File([blob], fileName, { type: blob.type })
  const shareOutcome = await shareFile(file)
  if (shareOutcome !== 'unsupported') return shareOutcome
  downloadFile(file)
  return 'saved'
}
