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
