import { getDependencies } from '../server/env.ts'
import { deleteMe, readMe } from '../server/me-routes.ts'

export const GET = (request: Request) => readMe(request, getDependencies().repository)

export const DELETE = (request: Request) => deleteMe(request, getDependencies().repository)
