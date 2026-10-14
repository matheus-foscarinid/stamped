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
  const location = { host: 'map.test', pathname: '/', search, hash }
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
  return { values }
}

// private windows and strict privacy settings throw on any storage access
export const stubBlockedStorage = () => {
  const blocked = () => {
    throw new DOMException('blocked', 'SecurityError')
  }
  vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked })
}

interface PointerStubEvent {
  pointerId?: number
  pointerType?: string
  button?: number
  x?: number
  y?: number
}

// node has no PointerEvent, so tests dispatch plain events carrying the fields the code reads
export const createPointerEvent = (
  type: string,
  { pointerId = 1, pointerType = 'mouse', button = 0, x = 0, y = 0 }: PointerStubEvent = {}
) => Object.assign(new Event(type), { pointerId, pointerType, button, clientX: x, clientY: y })

export const stubCanvas = () =>
  Object.assign(new EventTarget(), {
    setPointerCapture: vi.fn(),
    getBoundingClientRect: () => ({ left: 0, top: 0 }),
  })

// a document whose events can land inside or outside a menu
export const stubDocument = () => {
  class StubNode extends EventTarget {}
  const document = new StubNode()
  const insideNode = new StubNode()
  const outsideNode = new StubNode()
  const menuRoot = { contains: (node: unknown) => node === insideNode }
  vi.stubGlobal('Node', StubNode)
  vi.stubGlobal('document', document)
  const press = (target: EventTarget) => {
    const event = createPointerEvent('pointerdown')
    Object.defineProperty(event, 'target', { value: target })
    const stopPropagation = vi.spyOn(event, 'stopPropagation')
    document.dispatchEvent(event)
    return { stopPropagation }
  }
  return {
    menuRoot,
    pressInside: () => press(insideNode),
    pressOutside: () => press(outsideNode),
  }
}

// each resolution query fires once, like a browser does when the window changes screens
export const stubPixelRatio = (initialRatio: number) => {
  const queries = new Map<string, EventTarget>()
  const browserWindow = {
    devicePixelRatio: initialRatio,
    matchMedia: (query: string) => {
      const list = queries.get(query) ?? new EventTarget()
      queries.set(query, list)
      return list
    },
  }
  vi.stubGlobal('window', browserWindow)
  const moveToScreen = (ratio: number) => {
    const previous = queries.get(`(resolution: ${browserWindow.devicePixelRatio}dppx)`)
    browserWindow.devicePixelRatio = ratio
    previous?.dispatchEvent(new Event('change'))
  }
  return { moveToScreen }
}

export const stubBrowserLanguages = (languages: string[]) => {
  vi.stubGlobal('navigator', { languages })
}

// serves locale files by language. a language left out answers 404
export const stubLocaleFiles = (files: Record<string, unknown>) => {
  const fetch = vi.fn((url: string) => {
    const language = url.match(/\/locales\/(\w+)\.json$/)?.[1] ?? ''
    const body = files[language]
    if (body === undefined) return Promise.resolve(new Response(null, { status: 404 }))
    return Promise.resolve(new Response(JSON.stringify(body)))
  })
  vi.stubGlobal('fetch', fetch)
  return { fetch }
}

// stub after vue is imported, since vue's dom layer grabs the real document on load
export const stubPageLanguage = () => {
  const documentElement = { lang: 'en' }
  vi.stubGlobal('document', { documentElement })
  return { documentElement }
}
