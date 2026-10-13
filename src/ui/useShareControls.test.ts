import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderCard } from '@/share/card-image'
import { saveFile } from '@/share/save-file'
import { stubClipboard } from '@/test/browser-stubs'
import { mountComposable } from '@/test/composables'
import { useShareControls } from './useShareControls.ts'

vi.mock('@/share/card-image', () => ({ renderCard: vi.fn() }))
vi.mock('@/share/save-file', () => ({ saveFile: vi.fn() }))

const IMAGE = new Blob(['png'], { type: 'image/png' })
const MAP_INPUT = { projection: () => 'mercator' as const, visited: () => ['br' as const] }

const mountShareControls = () => mountComposable(() => useShareControls(MAP_INPUT)).result

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(renderCard).mockResolvedValue(IMAGE)
  vi.mocked(saveFile).mockResolvedValue('saved')
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('after copying the link', () => {
  it('confirms, then clears the message', async () => {
    stubClipboard()
    const { status, copyLink } = mountShareControls()
    await copyLink()
    expect(status.value).toBe('Link copied')
    vi.advanceTimersByTime(2500)
    expect(status.value).toBe('')
  })

  it('points to the address bar when the clipboard is blocked', async () => {
    stubClipboard(() => Promise.reject(new DOMException('denied', 'NotAllowedError')))
    const { status, copyLink } = mountShareControls()
    await copyLink()
    expect(status.value).toBe('Copy blocked. The address bar has your link')
  })
})

describe('after saving an image', () => {
  it('draws the current map and confirms the save', async () => {
    const { status, isSaving, saveImage } = mountShareControls()
    await saveImage('story')
    expect(renderCard).toHaveBeenCalledWith('story', { projection: 'mercator', visited: ['br'] })
    expect(saveFile).toHaveBeenCalledWith(IMAGE, 'travel-map-story.png')
    expect(status.value).toBe('Image saved')
    expect(isSaving.value).toBe(false)
  })

  it('stays quiet when the user closes the share sheet', async () => {
    vi.mocked(saveFile).mockResolvedValue('cancelled')
    const { status, saveImage } = mountShareControls()
    await saveImage('post')
    expect(status.value).toBe('')
  })

  it('says so and lets the user retry when drawing fails', async () => {
    vi.mocked(renderCard).mockRejectedValue(new Error('canvas 2d context unavailable'))
    const { status, isSaving, saveImage } = mountShareControls()
    await saveImage('wide')
    expect(status.value).toBe('Could not create the image. Try again')
    expect(isSaving.value).toBe(false)
  })
})

describe('while an image is saving', () => {
  it('ignores another press', async () => {
    const { saveImage } = mountShareControls()
    const firstSave = saveImage('post')
    await saveImage('story')
    await firstSave
    expect(renderCard).toHaveBeenCalledOnce()
  })
})
