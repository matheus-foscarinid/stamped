import { describe, expect, it } from 'vitest'
import { groupByContinent } from '@/countries'
import { paginateStamps } from './pages.ts'

const EIGHT_IN_EUROPE_ONE_IN_ASIA = groupByContinent(
  ['fr', 'de', 'es', 'it', 'pt', 'nl', 'be', 'at', 'jp'],
  'en'
)

describe('paginateStamps', () => {
  it('gives no pages before any country is marked', () => {
    expect(paginateStamps([], 6)).toEqual([])
  })

  it('carries a full continent over to the next page', () => {
    const pages = paginateStamps(EIGHT_IN_EUROPE_ONE_IN_ASIA, 6)
    expect(pages.map(page => [page.continent, page.codes.length])).toEqual([
      ['asia', 1],
      ['europe', 6],
      ['europe', 2],
    ])
  })

  it('keeps the continent totals on every page it spans', () => {
    const europePages = paginateStamps(EIGHT_IN_EUROPE_ONE_IN_ASIA, 6).slice(1)
    for (const page of europePages) expect([page.visitedCount, page.total]).toEqual([8, 52])
  })
})
