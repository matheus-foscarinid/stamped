import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderPassport } from '@/passport/passport-image'
import { renderCard } from '@/share/card-image'
import { saveFile } from '@/share/save-file'
import { stubAddressBar, stubClipboard } from '@/test/browser-stubs'
import { mountComposable } from '@/test/composables'
import { useShareControls } from './useShareControls.ts'

vi.mock('@/passport/passport-image', () => ({ renderPassport: vi.fn() }))
vi.mock('@/share/card-image', () => ({ renderCard: vi.fn() }))
vi.mock('@/share/save-file', () => ({ saveFile: vi.fn() }))

const IMAGE = new Blob(['png'], { type: 'image/png' })
const MAP_INPUT = {
  projection: () => 'mercator' as const,
  visited: () => ['br' as const],
  wishlist: () => ['is' as const],
}

const TWO_CONTINENTS_INPUT = { ...MAP_INPUT, visited: () => ['br' as const, 'fr' as const] }

interface MountShareControlsOptions {
  input?: Parameters<typeof useShareControls>[0]
}

const mountShareControls = ({ input = MAP_INPUT }: MountShareControlsOptions = {}) =>
  mountComposable(() => useShareControls(input)).result

beforeEach(() => {
  vi.useFakeTimers()
  stubAddressBar()
  vi.mocked(renderCard).mockResolvedValue(IMAGE)
  vi.mocked(renderPassport).mockResolvedValue(IMAGE)
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
  it('draws the current map with its stats and link, and confirms the save', async () => {
    const { status, saveImage } = mountShareControls()
    await saveImage('story')
    expect(renderCard).toHaveBeenCalledWith('story', {
      projection: 'mercator',
      visited: ['br'],
      wishlist: ['is'],
      progress: expect.closeTo(1 / 255),
      text: {
        eyebrow: 'My travel map',
        count: '1',
        countLabel: 'country visited',
        progressLabel: '1 of 255 countries',
        share: '<1%',
        tiles: [
          { value: '1/193', label: 'UN members' },
          { value: '1/7', label: 'Continents' },
        ],
        footer: 'Map yours at map.test',
      },
    })
    expect(saveFile).toHaveBeenCalledWith(IMAGE, 'stamped-story.png')
    expect(status.value).toBe('Image saved')
  })

  it('draws the passport instead of a card, with its stamps in continent order', async () => {
    const { saveImage } = mountShareControls({ input: TWO_CONTINENTS_INPUT })
    await saveImage('passport')
    const [content] = vi.mocked(renderPassport).mock.calls[0] ?? []
    expect(content?.stamps).toEqual([
      { code: 'fr', name: 'France', continent: 'Europe' },
      { code: 'br', name: 'Brazil', continent: 'South America' },
    ])
    expect(content?.text.count).toBe(2)
    expect(renderCard).not.toHaveBeenCalled()
    expect(saveFile).toHaveBeenCalledWith(IMAGE, 'stamped-passport.png')
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

describe('after a passport image fails', () => {
  it('says so and lets the user retry', async () => {
    vi.mocked(renderPassport).mockRejectedValue(new Error('stamp image failed to decode'))
    const { status, isSaving, saveImage } = mountShareControls()
    await saveImage('passport')
    expect(status.value).toBe('Could not create the image. Try again')
    expect(isSaving.value).toBe(false)
    expect(saveFile).not.toHaveBeenCalled()
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
