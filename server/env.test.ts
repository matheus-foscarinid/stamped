import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadFreshDependencies } from './test/fakes.ts'

const FULL_ENV = {
  DATABASE_URL: 'postgresql://user:password@db.example.com/stamped',
  GOOGLE_CLIENT_ID: 'client-id',
  GOOGLE_CLIENT_SECRET: 'client-secret',
}

beforeEach(() => {
  for (const [name, value] of Object.entries(FULL_ENV)) vi.stubEnv(name, value)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getDependencies', () => {
  it('reads the google config from the environment', async () => {
    const { google } = await loadFreshDependencies()

    expect(google).toEqual({ clientId: 'client-id', clientSecret: 'client-secret' })
  })

  it.each(Object.keys(FULL_ENV))('fails on the first request when %s is not set', async name => {
    vi.stubEnv(name, '')

    await expect(loadFreshDependencies()).rejects.toThrow(`${name} is not set`)
  })
})
