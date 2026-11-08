import { describe, expect, it } from 'vitest'
import { listPendingMigrations } from './pending-migrations.ts'

describe('listPendingMigrations', () => {
  it('runs the files that have not been applied, in prefix order', () => {
    const files = ['010_cities.sql', '001_accounts.sql', '002_states.sql']

    expect(listPendingMigrations(files, ['001_accounts.sql'])).toEqual([
      '002_states.sql',
      '010_cities.sql',
    ])
  })

  it('ignores anything that is not sql', () => {
    expect(listPendingMigrations(['001_accounts.sql', 'README.md'], [])).toEqual([
      '001_accounts.sql',
    ])
  })
})
