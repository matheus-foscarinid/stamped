import { describe, expect, it } from 'vitest'
import { InvalidBodyError, readPlacesBody, readPreferencesBody } from './validate.ts'

describe('readPlacesBody', () => {
  it('keeps known countries and drops a wish for a visited one', () => {
    const body = { kind: 'country', visited: ['br', 'jp', 'br'], wishlist: ['jp', 'is'] }

    expect(readPlacesBody(body)).toEqual({ visited: ['br', 'jp'], wishlist: ['is'] })
  })

  it('accepts a list right at the size limit', () => {
    const body = { kind: 'country', visited: Array(400).fill('br'), wishlist: [] }

    expect(readPlacesBody(body).visited).toEqual(['br'])
  })

  it.each([
    ['an unknown visited country', { kind: 'country', visited: ['zz'], wishlist: [] }],
    ['an unknown wished country', { kind: 'country', visited: [], wishlist: ['zz'] }],
    ['a kind that has no catalog yet', { kind: 'city', visited: [], wishlist: [] }],
    ['a list that is not a list', { kind: 'country', visited: 'br', wishlist: [] }],
    [
      'a list one past the size limit',
      { kind: 'country', visited: Array(401).fill('br'), wishlist: [] },
    ],
    ['a body that is not an object', null],
  ])('refuses %s', (_case, body) => {
    expect(() => readPlacesBody(body)).toThrow(InvalidBodyError)
  })
})

describe('readPreferencesBody', () => {
  it('accepts a partial update', () => {
    expect(readPreferencesBody({ theme: 'dracula' })).toEqual({ theme: 'dracula' })
  })

  it.each([
    ['an unknown theme', { theme: 'neon' }],
    ['an unknown cover', { cover: 'gold' }],
    ['an unknown language', { language: 'xx' }],
    ['a field that is not a preference', { email: 'x@y.z' }],
    ['a field every object inherits', { toString: 'x' }],
    ['the constructor field', { constructor: 'x' }],
    ['a body that is not an object', ['dracula']],
  ])('refuses %s', (_case, body) => {
    expect(() => readPreferencesBody(body)).toThrow(InvalidBodyError)
  })
})
