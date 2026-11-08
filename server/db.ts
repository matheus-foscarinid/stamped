import { type NeonQueryFunction, neon } from '@neondatabase/serverless'
import type {
  AccountPreferences,
  AccountResponse,
  AccountUser,
  PlaceLists,
  PreferencesBody,
} from '../src/account/contract.ts'
import type { CountryCode } from '../src/countries/catalog.ts'
import type { GoogleProfile } from './google.ts'

interface NewSession {
  tokenHash: Buffer
  userId: string
  expiresAt: Date
}

export interface Repository {
  upsertGoogleUser: (profile: GoogleProfile) => Promise<string>
  createSession: (session: NewSession) => Promise<void>
  findSessionUserId: (tokenHash: Buffer) => Promise<string | null>
  deleteSession: (tokenHash: Buffer) => Promise<void>
  readSessionAccount: (tokenHash: Buffer) => Promise<AccountResponse | null>
  replaceCountries: (userId: string, lists: PlaceLists<CountryCode>) => Promise<void>
  writePreferences: (userId: string, preferences: PreferencesBody) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
}

type Sql = NeonQueryFunction<false, false>

interface UserRow {
  email: string
  name: string | null
  avatar_url: string | null
  first_saved_at: Date | null
  theme: AccountPreferences['theme']
  cover: AccountPreferences['cover']
  language: AccountPreferences['language']
}

interface PlaceRow {
  code: CountryCode
  list: keyof PlaceLists
}

const toUser = (row: UserRow): AccountUser => ({
  email: row.email,
  name: row.name,
  avatarUrl: row.avatar_url,
})

const toPreferences = (row: UserRow): AccountPreferences => ({
  theme: row.theme,
  cover: row.cover,
  language: row.language,
})

const toCountryLists = (rows: PlaceRow[]): PlaceLists<CountryCode> => ({
  visited: rows.filter(row => row.list === 'visited').map(row => row.code),
  wishlist: rows.filter(row => row.list === 'wishlist').map(row => row.code),
})

const readSessionAccount = (sql: Sql) => async (tokenHash: Buffer) => {
  const [users, places] = (await sql.transaction([
    sql`select u.email, u.name, u.avatar_url, u.first_saved_at, p.theme, p.cover, p.language
        from sessions s
        join users u on u.id = s.user_id
        left join preferences p on p.user_id = u.id
        where s.token_hash = ${tokenHash} and s.expires_at > now()`,
    sql`select pl.code, pl.list
        from places pl join sessions s on s.user_id = pl.user_id
        where s.token_hash = ${tokenHash} and s.expires_at > now() and pl.kind = 'country'
        order by pl.position`,
  ])) as [UserRow[], PlaceRow[]]
  const user = users[0]
  if (!user) return null
  return {
    user: toUser(user),
    preferences: toPreferences(user),
    places: { country: toCountryLists(places) },
    hasSavedData: user.first_saved_at !== null,
  }
}

// upsert then prune, so a country that stays on the map keeps its created_at
const replaceCountries = (sql: Sql) => async (userId: string, lists: PlaceLists<CountryCode>) => {
  const codes = [...lists.visited, ...lists.wishlist]
  const marks = codes.map((_, index) => (index < lists.visited.length ? 'visited' : 'wishlist'))
  const positions = codes.map((_, index) => index)
  await sql.transaction([
    sql`insert into places (user_id, kind, code, country, list, position)
        select ${userId}, 'country', code, code, mark::place_list, position
        from unnest(${codes}::text[], ${marks}::text[], ${positions}::int[]) as t(code, mark, position)
        on conflict (user_id, kind, code) do update set list = excluded.list, position = excluded.position`,
    sql`delete from places where user_id = ${userId} and kind = 'country' and not (code = any(${codes}::text[]))`,
    sql`update users set first_saved_at = coalesce(first_saved_at, now()) where id = ${userId}`,
  ])
}

const writePreferences = (sql: Sql) => async (userId: string, preferences: PreferencesBody) => {
  const has = (key: keyof PreferencesBody) => key in preferences
  await sql`insert into preferences (user_id, theme, cover, language)
    values (${userId}, ${preferences.theme ?? null}, ${preferences.cover ?? null}, ${preferences.language ?? null})
    on conflict (user_id) do update set
      theme = case when ${has('theme')} then excluded.theme else preferences.theme end,
      cover = case when ${has('cover')} then excluded.cover else preferences.cover end,
      language = case when ${has('language')} then excluded.language else preferences.language end,
      updated_at = now()`
}

const upsertGoogleUser = (sql: Sql) => async (profile: GoogleProfile) => {
  const rows = (await sql`
    insert into users (google_sub, email, name, avatar_url)
    values (${profile.sub}, ${profile.email}, ${profile.name}, ${profile.picture})
    on conflict (google_sub) do update set
      email = excluded.email, name = excluded.name, avatar_url = excluded.avatar_url
    returning id`) as { id: string }[]
  const id = rows[0]?.id
  if (!id) throw new Error('user upsert returned no id')
  return id
}

// signing in sweeps old sessions, so the table never needs a cron
const createSession =
  (sql: Sql) =>
  async ({ tokenHash, userId, expiresAt }: NewSession) => {
    await sql.transaction([
      sql`delete from sessions where expires_at < now()`,
      sql`insert into sessions (token_hash, user_id, expires_at)
        values (${tokenHash}, ${userId}, ${expiresAt})`,
    ])
  }

const findSessionUserId = (sql: Sql) => async (tokenHash: Buffer) => {
  const rows = (await sql`
    select user_id from sessions where token_hash = ${tokenHash} and expires_at > now()`) as {
    user_id: string
  }[]
  return rows[0]?.user_id ?? null
}

const deleteSession = (sql: Sql) => async (tokenHash: Buffer) => {
  await sql`delete from sessions where token_hash = ${tokenHash}`
}

const deleteUser = (sql: Sql) => async (userId: string) => {
  await sql`delete from users where id = ${userId}`
}

export const createRepository = (databaseUrl: string): Repository => {
  const sql = neon(databaseUrl)
  return {
    upsertGoogleUser: upsertGoogleUser(sql),
    createSession: createSession(sql),
    findSessionUserId: findSessionUserId(sql),
    deleteSession: deleteSession(sql),
    readSessionAccount: readSessionAccount(sql),
    replaceCountries: replaceCountries(sql),
    writePreferences: writePreferences(sql),
    deleteUser: deleteUser(sql),
  }
}
