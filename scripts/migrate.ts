// run by hand with `npm run db:migrate`, never from the build, so a preview deploy can't change prod
import { readdirSync, readFileSync } from 'node:fs'
import { Pool } from '@neondatabase/serverless'
import { listPendingMigrations } from '../server/pending-migrations.ts'

const MIGRATIONS_DIR = new URL('../server/migrations/', import.meta.url)

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set. Run `vercel env pull` first')

const pool = new Pool({ connectionString })

const readApplied = async (): Promise<string[]> => {
  await pool.query('create table if not exists schema_migrations (name text primary key)')
  const { rows } = await pool.query<{ name: string }>('select name from schema_migrations')
  return rows.map(row => row.name)
}

const applyMigration = async (name: string) => {
  const client = await pool.connect()
  try {
    await client.query('begin')
    await client.query(readFileSync(new URL(name, MIGRATIONS_DIR), 'utf8'))
    await client.query('insert into schema_migrations (name) values ($1)', [name])
    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}

const pending = listPendingMigrations(readdirSync(MIGRATIONS_DIR), await readApplied())
for (const name of pending) {
  await applyMigration(name)
  console.log(`applied ${name}`)
}
console.log(pending.length === 0 ? 'nothing to migrate' : `${pending.length} applied`)
await pool.end()
