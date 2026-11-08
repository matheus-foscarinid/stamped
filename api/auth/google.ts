import { startGoogleSignIn } from '../../server/auth-routes.ts'
import { getDependencies } from '../../server/env.ts'

export const GET = (request: Request) => startGoogleSignIn(request, getDependencies())
