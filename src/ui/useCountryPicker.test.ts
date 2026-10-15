import { describe, expect, it, vi } from 'vitest'
import { COUNTRY_CODES, type CountryCode, type CountryMark } from '@/countries'
import { mountComposable } from '@/test/composables'
import { useCountryPicker } from './useCountryPicker.ts'

const MARKS: Partial<Record<CountryCode, CountryMark>> = {
  fr: 'visited',
  pt: 'visited',
  jp: 'wishlist',
}

const mountPicker = () => {
  const onPick = vi.fn()
  const picker = mountComposable(() =>
    useCountryPicker({ getMark: code => MARKS[code] ?? null, canPick: () => true, onPick })
  ).result
  const shownCodes = () =>
    picker.sections.value.flatMap(section => section.rows.map(row => row.code))
  return { ...picker, onPick, shownCodes }
}

describe('before anything is typed', () => {
  it('lists every country once, by continent', () => {
    const { sections, shownCodes } = mountPicker()
    expect(shownCodes().sort()).toEqual([...COUNTRY_CODES].sort())
    expect(sections.value.every(section => section.continent !== null)).toBe(true)
  })

  it('counts the visits in each continent', () => {
    const { sections } = mountPicker()
    const europe = sections.value.find(section => section.continent === 'europe')
    expect(europe?.visitedCount).toBe(2)
  })

  it('counts the marks on each list', () => {
    expect(mountPicker().counts.value).toEqual({ visited: 2, wishlist: 1 })
  })
})

describe('with a filter on', () => {
  it('shows only the countries on that list and drops continents without one', () => {
    const { filter, sections, shownCodes } = mountPicker()
    filter.value = 'visited'
    expect(shownCodes().sort()).toEqual(['fr', 'pt'])
    expect(sections.value.map(section => section.continent)).toEqual(['europe'])
  })
})

describe('while searching', () => {
  it('ranks every match in one list, past the eight the small search shows', () => {
    const { query, sections } = mountPicker()
    query.value = 'a'
    expect(sections.value).toHaveLength(1)
    expect(sections.value[0]?.continent).toBeNull()
    expect(sections.value[0]?.rows.length).toBeGreaterThan(8)
  })

  it('keeps the query after a pick, so several countries go in a row', () => {
    const { query, pick, onPick } = mountPicker()
    query.value = 'guinea'
    pick('gn')
    pick('gw')
    expect(onPick.mock.calls).toEqual([['gn'], ['gw']])
    expect(query.value).toBe('guinea')
  })
})
