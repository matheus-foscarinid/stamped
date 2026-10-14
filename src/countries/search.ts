import { COUNTRY_ALIASES, COUNTRY_CODES, type CountryCode } from './catalog.ts'
import { getFlagEmoji } from './flags.ts'
import { getCountryName } from './names.ts'

export interface CountryMatch {
  code: CountryCode
  name: string
  flag: string
}

interface SearchEntry {
  code: CountryCode
  name: string
  terms: string[]
}

const DEFAULT_LIMIT = 8
// lower ranks first: exact, prefix, start of a later word, anywhere
const RANK_EXACT = 0
const RANK_PREFIX = 1
const RANK_WORD = 2
const RANK_ANYWHERE = 3

const entriesByLocale = new Map<string, SearchEntry[]>()

// "Côte d’Ivoire" and "cote d'ivoire" both become "cote d ivoire"
const normalizeForSearch = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

// english names stay searchable in every language, since many people type those
const buildEntry = (code: CountryCode, locale: string): SearchEntry => {
  const name = getCountryName(code, locale)
  const englishName = getCountryName(code, 'en')
  const terms = [name, englishName, code, ...(COUNTRY_ALIASES[code] ?? [])].map(normalizeForSearch)
  return { code, name, terms }
}

const getEntries = (locale: string): SearchEntry[] => {
  let entries = entriesByLocale.get(locale)
  if (!entries) {
    entries = COUNTRY_CODES.map(code => buildEntry(code, locale))
    entriesByLocale.set(locale, entries)
  }
  return entries
}

const rankTerm = (term: string, query: string): number | null => {
  if (term === query) return RANK_EXACT
  if (term.startsWith(query)) return RANK_PREFIX
  if (term.includes(` ${query}`)) return RANK_WORD
  if (term.includes(query)) return RANK_ANYWHERE
  return null
}

const rankEntry = (entry: SearchEntry, query: string): number | null => {
  const ranks = entry.terms.map(term => rankTerm(term, query)).filter(rank => rank !== null)
  return ranks.length > 0 ? Math.min(...ranks) : null
}

interface SearchOptions {
  locale: string
  limit?: number
}

export const searchCountries = (
  query: string,
  { locale, limit = DEFAULT_LIMIT }: SearchOptions
): CountryMatch[] => {
  const normalizedQuery = normalizeForSearch(query)
  if (normalizedQuery === '') return []
  return getEntries(locale)
    .map(entry => ({ entry, rank: rankEntry(entry, normalizedQuery) }))
    .filter((ranked): ranked is { entry: SearchEntry; rank: number } => ranked.rank !== null)
    .sort((a, b) => a.rank - b.rank || a.entry.name.localeCompare(b.entry.name, locale))
    .slice(0, limit)
    .map(({ entry }) => ({ code: entry.code, name: entry.name, flag: getFlagEmoji(entry.code) }))
}
