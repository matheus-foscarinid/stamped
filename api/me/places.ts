import { getDependencies } from '../../server/env.ts'
import { replaceMyPlaces } from '../../server/me-routes.ts'

export const PUT = (request: Request) => replaceMyPlaces(request, getDependencies().repository)
