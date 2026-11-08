import { getDependencies } from '../../server/env.ts'
import { updateMyPreferences } from '../../server/me-routes.ts'

export const PATCH = (request: Request) =>
  updateMyPreferences(request, getDependencies().repository)
