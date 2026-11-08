import type { Repository } from './db.ts'
import {
  readJson,
  readSessionHash,
  respondEmpty,
  respondJson,
  respondSignedOut,
  withMutatingUser,
} from './http.ts'
import { buildClearedSessionCookies } from './session.ts'
import { readPlacesBody, readPreferencesBody } from './validate.ts'

export const readMe = async (request: Request, repository: Repository): Promise<Response> => {
  const tokenHash = readSessionHash(request)
  const account = tokenHash ? await repository.readSessionAccount(tokenHash) : null
  return account ? respondJson(account) : respondSignedOut()
}

export const replaceMyPlaces = (request: Request, repository: Repository) =>
  withMutatingUser(request, repository, async userId => {
    await repository.replaceCountries(userId, readPlacesBody(await readJson(request)))
    return respondEmpty()
  })

export const updateMyPreferences = (request: Request, repository: Repository) =>
  withMutatingUser(request, repository, async userId => {
    await repository.writePreferences(userId, readPreferencesBody(await readJson(request)))
    return respondEmpty()
  })

// the cascade removes sessions, preferences and places with the user
export const deleteMe = (request: Request, repository: Repository) =>
  withMutatingUser(request, repository, async userId => {
    await repository.deleteUser(userId)
    return respondEmpty(buildClearedSessionCookies())
  })
