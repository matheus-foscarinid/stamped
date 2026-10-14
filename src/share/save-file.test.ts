import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { rejectWith, stubDevice } from '@/test/browser-stubs'
import { saveFile } from './save-file.ts'

const IMAGE = new Blob(['png'], { type: 'image/png' })
const FILE_NAME = 'stamped-post.png'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('on a desktop', () => {
  it('downloads the image under its file name', async () => {
    const { link, share } = stubDevice({ canShareFiles: true })
    await expect(saveFile(IMAGE, FILE_NAME)).resolves.toBe('saved')
    expect(link.click).toHaveBeenCalledOnce()
    expect(link.download).toBe(FILE_NAME)
    expect(share).not.toHaveBeenCalled()
  })

  it('keeps the download url alive while ios asks the user to confirm', async () => {
    const { revokeObjectURL } = stubDevice()
    await saveFile(IMAGE, FILE_NAME)
    vi.advanceTimersByTime(30_000)
    expect(revokeObjectURL).not.toHaveBeenCalled()
    vi.advanceTimersByTime(10_000)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:map')
  })
})

describe('on a phone', () => {
  it('opens the share sheet instead of a download', async () => {
    const { link, share } = stubDevice({ isTouch: true, canShareFiles: true })
    await expect(saveFile(IMAGE, FILE_NAME)).resolves.toBe('saved')
    expect(share).toHaveBeenCalledOnce()
    expect(link.click).not.toHaveBeenCalled()
  })

  it('does nothing more when the user closes the share sheet', async () => {
    const { link } = stubDevice({
      isTouch: true,
      canShareFiles: true,
      share: rejectWith('AbortError'),
    })
    await expect(saveFile(IMAGE, FILE_NAME)).resolves.toBe('cancelled')
    expect(link.click).not.toHaveBeenCalled()
  })

  it('falls back to the download when sharing is refused', async () => {
    const { link } = stubDevice({
      isTouch: true,
      canShareFiles: true,
      share: rejectWith('NotAllowedError'),
    })
    await expect(saveFile(IMAGE, FILE_NAME)).resolves.toBe('saved')
    expect(link.click).toHaveBeenCalledOnce()
  })

  it('downloads when the browser cannot share files', async () => {
    const { link } = stubDevice({ isTouch: true })
    await saveFile(IMAGE, FILE_NAME)
    expect(link.click).toHaveBeenCalledOnce()
  })
})
