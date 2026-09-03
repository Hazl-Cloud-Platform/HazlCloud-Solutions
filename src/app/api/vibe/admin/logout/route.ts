import { clearAdminCookie } from '@/lib/vibe/adminAuth'
import { assertSameOrigin, forbidden, ok } from '@/lib/vibe/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return forbidden('Cross-origin requests are not allowed')
  const c = clearAdminCookie()
  const res = ok({})
  res.cookies.set(c.name, c.value, c.options)
  return res
}
