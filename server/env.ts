import { createRepository, type Repository } from './db.ts'
import type { GoogleConfig } from './google.ts'

interface ServerDependencies {
  repository: Repository
  google: GoogleConfig
}

const readRequired = (name: string): string => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

let dependencies: ServerDependencies | undefined

// lazy, so a missing variable fails on the first request
export const getDependencies = (): ServerDependencies => {
  dependencies ??= {
    repository: createRepository(readRequired('DATABASE_URL')),
    google: {
      clientId: readRequired('GOOGLE_CLIENT_ID'),
      clientSecret: readRequired('GOOGLE_CLIENT_SECRET'),
    },
  }
  return dependencies
}
