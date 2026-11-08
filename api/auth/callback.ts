import { finishGoogleSignIn } from '../../server/auth-routes.ts'
import { getDependencies } from '../../server/env.ts'

export const GET = (request: Request) => finishGoogleSignIn(request, getDependencies())
