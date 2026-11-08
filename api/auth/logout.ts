import { signOut } from '../../server/auth-routes.ts'
import { getDependencies } from '../../server/env.ts'

export const POST = (request: Request) => signOut(request, getDependencies().repository)
