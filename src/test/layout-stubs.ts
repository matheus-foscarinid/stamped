import { vi } from 'vitest'

interface PageTrackStubOptions {
  pageCount: number
  pageWidth?: number
}

interface KeyPress {
  key: string
  target?: EventTarget
  modifiers?: Partial<Pick<KeyboardEvent, 'metaKey' | 'altKey' | 'ctrlKey' | 'shiftKey'>>
}

// a horizontal track that scrolls instantly and reports it, like a snapped scroller
export const stubPageTrack = ({ pageCount, pageWidth = 400 }: PageTrackStubOptions) => {
  class StubElement extends EventTarget {
    isContentEditable = false
    tagName: string
    clientWidth = pageWidth
    scrollWidth = pageWidth * pageCount
    scrollLeft = 0
    constructor(tagName = 'div') {
      super()
      this.tagName = tagName
    }
    closest(selector: string) {
      return selector.split(', ').includes(this.tagName) ? this : null
    }
    scrollBy({ left = 0 }: ScrollToOptions) {
      const maxScroll = this.scrollWidth - this.clientWidth
      this.scrollLeft = Math.min(maxScroll, Math.max(0, this.scrollLeft + left))
      this.dispatchEvent(new Event('scroll'))
    }
  }
  vi.stubGlobal('HTMLElement', StubElement)
  vi.stubGlobal('document', new EventTarget())
  vi.stubGlobal('window', new EventTarget())
  const track = new StubElement()
  // node has no KeyboardEvent, so a plain cancelable event carries the key
  const pressKey = ({ key, target = track, modifiers = {} }: KeyPress) => {
    const event = Object.assign(new Event('keydown', { cancelable: true }), { key, ...modifiers })
    Object.defineProperty(event, 'target', { value: target })
    document.dispatchEvent(event)
    return event
  }
  // a wide screen shows two pages side by side, so each spread gets wider
  const resizeTrack = (pagesPerSpread: number) => {
    track.clientWidth = pageWidth * pagesPerSpread
    window.dispatchEvent(new Event('resize'))
  }
  return {
    track: track as unknown as HTMLElement,
    pressKey,
    resizeTrack,
    searchField: new StubElement('input'),
    dialogButton: new StubElement('dialog'),
  }
}

// resize, mutation and pixel-ratio watchers that fire on demand, since node has none of them
export const stubRedrawObservers = () => {
  const observedElements = new Map<unknown, () => void>()
  const themeCallbacks = new Set<() => void>()
  const ratioQuery = new EventTarget()
  class StubResizeObserver {
    callback: () => void
    constructor(callback: () => void) {
      this.callback = callback
    }
    observe(element: unknown) {
      observedElements.set(element, this.callback)
    }
    unobserve(element: unknown) {
      observedElements.delete(element)
    }
    disconnect() {
      observedElements.clear()
    }
  }
  class StubMutationObserver {
    callback: () => void
    constructor(callback: () => void) {
      this.callback = callback
    }
    observe() {
      themeCallbacks.add(this.callback)
    }
    disconnect() {
      themeCallbacks.delete(this.callback)
    }
  }
  vi.stubGlobal('ResizeObserver', StubResizeObserver)
  vi.stubGlobal('MutationObserver', StubMutationObserver)
  vi.stubGlobal('document', { documentElement: {} })
  vi.stubGlobal('window', { devicePixelRatio: 1, matchMedia: () => ratioQuery })
  return {
    resize: (element: unknown) => observedElements.get(element)?.(),
    switchTheme: () => {
      for (const callback of themeCallbacks) callback()
    },
    changePixelRatio: () => ratioQuery.dispatchEvent(new Event('change')),
  }
}
