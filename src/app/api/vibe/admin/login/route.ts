import { attemptLogin } from '@/lib/vibe/adminAuth'
import { assertSameOrigin, badRequest, fail, forbidden, ok, serverError } from '@/lib/vibe/http'
import { requestIpHash } from '@/lib/vibe/ip'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return forbidden('Cross-origin requests are not allowed')
  try {
    const body = (await req.json().catch(() => null)) as { email?: unknown; password?: unknown } | null
    const email = typeof body?.email === 'string' ? body.email.slice(0, 254) : ''
    // Bounded before any work: scrypt cost is independent of input length, but
    // an unbounded field is still an unbounded row in the attempts table.
    const password = typeof body?.password === 'string' ? body.password.slice(0, 512) : ''
    if (!email || !password) return badRequest('Email and password are required.')

    const result = await attemptLogin({ email, password, ipHash: requestIpHash(req) })
    if (!result.ok) return fail(result.status, result.error)

    const res = ok({ email: result.email })
    res.cookies.set(result.cookie.name, result.cookie.value, result.cookie.options)
    return res
  } catch (err) {
    console.error('[vibe] admin login:', err)
    return serverError()
  }
}
