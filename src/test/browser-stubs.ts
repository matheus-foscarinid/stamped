import { vi } from 'vitest'

interface DeviceStubOptions {
  isTouch?: boolean
  canShareFiles?: boolean
  share?: () => Promise<void>
}

// tests run in node, so each one stubs only the browser apis its code touches
export const stubDevice = ({
  isTouch = false,
  canShareFiles = false,
  share = () => Promise.resolve(),
}: DeviceStubOptions = {}) => {
  const link = { href: '', download: '', click: vi.fn() }
  const shareMock = vi.fn(share)
  vi.stubGlobal('window', { matchMedia: () => ({ matches: isTouch }) })
  vi.stubGlobal('navigator', { canShare: () => canShareFiles, share: shareMock })
  vi.stubGlobal('document', { createElement: () => link })
  const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:map')
  return { link, share: shareMock, revokeObjectURL }
}

export const rejectWith = (name: string) => () => Promise.reject(new DOMException(name, name))

interface AddressBarStubOptions {
  hash?: string
  search?: string
}

export const stubAddressBar = ({ hash = '', search = '' }: AddressBarStubOptions = {}) => {
  const location = { pathname: '/', search, hash }
  const browserWindow = Object.assign(new EventTarget(), { location })
  const replaceState = vi.fn((_state: unknown, _unused: string, url: string) => {
    location.hash = new URL(url, 'https://map.test').hash
  })
  vi.stubGlobal('window', browserWindow)
  vi.stubGlobal('history', { replaceState })
  const pasteLink = (pastedHash: string) => {
    location.hash = pastedHash
    browserWindow.dispatchEvent(new Event('hashchange'))
  }
  return { location, replaceState, pasteLink }
}

export const stubClipboard = (writeText: () => Promise<void> = () => Promise.resolve()) => {
  vi.stubGlobal('window', { location: { href: 'https://map.test/#v=br' } })
  vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn(writeText) } })
}

interface AnimationFrameStubOptions {
  prefersReducedMotion?: boolean
}

// frames only run when a test advances the clock, so each step is predictable
export const stubAnimationFrames = ({
  prefersReducedMotion = false,
}: AnimationFrameStubOptions = {}) => {
  let pending: FrameRequestCallback[] = []
  let now = 0
  vi.stubGlobal('window', { matchMedia: () => ({ matches: prefersReducedMotion }) })
  vi.stubGlobal('performance', { now: () => now })
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => pending.push(callback))
  vi.stubGlobal('cancelAnimationFrame', () => {
    pending = []
  })
  const advanceBy = (milliseconds: number) => {
    now += milliseconds
    const due = pending
    pending = []
    for (const callback of due) callback(now)
  }
  return { advanceBy, hasPendingFrame: () => pending.length > 0 }
}

export const stubStorage = (initial: Record<string, string> = {}) => {
  const values = new Map(Object.entries(initial))
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  })
}
