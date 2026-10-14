import { afterEach, describe, expect, it, vi } from 'vitest'
import { createKeyEvent } from '@/test/browser-stubs'
import { mountComposable } from '@/test/composables'
import { useCountrySearch } from './useCountrySearch.ts'

const VISITED_FRANCE = (code: string) => (code === 'fr' ? 'visited' : null)

interface MountSearchOptions {
  canPick?: (code: string) => boolean
}

const mountSearch = ({ canPick = () => true }: MountSearchOptions = {}) => {
  const onPick = vi.fn()
  const search = mountComposable(() =>
    useCountrySearch({ getMark: VISITED_FRANCE, canPick, onPick })
  ).result
  return { ...search, onPick }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('pressing enter', () => {
  it('picks the top match and clears the query', () => {
    const { query, pickOnEnter, onPick } = mountSearch()
    query.value = 'france'
    pickOnEnter(createKeyEvent('Enter'))
    expect(onPick).toHaveBeenCalledWith('fr')
    expect(query.value).toBe('')
  })

  it('skips a match the mode cannot change and keeps the query when nothing else fits', () => {
    const { query, pickOnEnter, onPick } = mountSearch({ canPick: code => code !== 'fr' })
    query.value = 'france'
    pickOnEnter(createKeyEvent('Enter'))
    expect(onPick).not.toHaveBeenCalled()
    expect(query.value).toBe('france')
  })
})

describe('the results', () => {
  it('carry each country mark and whether it can be picked', () => {
    const { query, matches } = mountSearch({ canPick: code => code !== 'fr' })
    query.value = 'france'
    expect(matches.value[0]).toMatchObject({ code: 'fr', mark: 'visited', isPickable: false })
  })
})
