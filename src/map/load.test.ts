import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const INDEX = { codes: ['br', null] }
const OFFLINE = new TypeError('network down')

const fetchMock = vi.fn<typeof fetch>()

const loadFreshModule = async () => {
  vi.resetModules()
  return import('./load.ts')
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('after a failed load', () => {
  it('fetches the country index again instead of keeping the failure', async () => {
    const { loadCountryCodes } = await loadFreshModule()
    fetchMock.mockRejectedValueOnce(OFFLINE).mockResolvedValueOnce(Response.json(INDEX))
    await expect(loadCountryCodes()).rejects.toBe(OFFLINE)
    await expect(loadCountryCodes()).resolves.toEqual(INDEX.codes)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('fetches the map file again instead of keeping the failure', async () => {
    const { loadGeometry } = await loadFreshModule()
    fetchMock.mockRejectedValue(OFFLINE)
    await expect(loadGeometry('mercator')).rejects.toBe(OFFLINE)
    await expect(loadGeometry('mercator')).rejects.toBe(OFFLINE)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('after a successful load', () => {
  it('reuses the country index', async () => {
    const { loadCountryCodes } = await loadFreshModule()
    fetchMock.mockResolvedValue(Response.json(INDEX))
    await loadCountryCodes()
    await loadCountryCodes()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
