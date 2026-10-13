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

let entries: SearchEntry[] | null = null

// "Côte d’Ivoire" and "cote d'ivoire" both become "cote d ivoire"
const normalizeForSearch = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const buildEntry = (code: CountryCode): SearchEntry => {
  const name = getCountryName(code)
  const terms = [name, code, ...(COUNTRY_ALIASES[code] ?? [])].map(normalizeForSearch)
  return { code, name, terms }
}

const getEntries = (): SearchEntry[] => {
  entries ??= COUNTRY_CODES.map(buildEntry)
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

export const searchCountries = (query: string, limit = DEFAULT_LIMIT): CountryMatch[] => {
  const normalizedQuery = normalizeForSearch(query)
  if (normalizedQuery === '') return []
  return getEntries()
    .map(entry => ({ entry, rank: rankEntry(entry, normalizedQuery) }))
    .filter((ranked): ranked is { entry: SearchEntry; rank: number } => ranked.rank !== null)
    .sort((a, b) => a.rank - b.rank || a.entry.name.localeCompare(b.entry.name))
    .slice(0, limit)
    .map(({ entry }) => ({ code: entry.code, name: entry.name, flag: getFlagEmoji(entry.code) }))
}
