import { currentAdmin } from '@/lib/vibe/adminAuth'
import { listDesigns, staleDesignIds } from '@/lib/vibe/adminQueries'
import { allDesignPaths, removeDesign } from '@/lib/vibe/designs'
import { assertSameOrigin, badRequest, forbidden, ok, serverError, unauthorized } from '@/lib/vibe/http'
import { deleteDesign, scanStorage } from '@/lib/vibe/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!(await currentAdmin())) return unauthorized()
  try {
    const params = new URL(req.url).searchParams
    const limit = Math.min(100, Math.max(1, Number(params.get('limit')) || 40))
    const offset = Math.max(0, Number(params.get('offset')) || 0)
    const withLeadOnly = params.get('withLead') === '1'
    return ok({ designs: await listDesigns(limit, offset, withLeadOnly) })
  } catch (err) {
    console.error('[vibe] admin designs:', err)
    return serverError()
  }
}

/** Bulk maintenance: purge stale designs, or sweep files the index does not know
 *  about. Both are explicit admin actions rather than a background job, so nothing
 *  deletes visitor content without someone asking for it. */
export async function POST(req: Request) {
  if (!(await currentAdmin())) return unauthorized()
  if (!assertSameOrigin(req)) return forbidden('Cross-origin requests are not allowed')
  try {
    const body = (await req.json().catch(() => null)) as { action?: unknown; days?: unknown } | null

    if (body?.action === 'purge_stale') {
      const days = Math.max(1, Math.min(365, Number(body.days) || 30))
      const ids = await staleDesignIds(days)
      let removed = 0
      for (const id of ids) {
        if (await removeDesign(id).catch(() => false)) removed += 1
      }
      return ok({ removed, considered: ids.length })
    }

    if (body?.action === 'sweep_orphans') {
      // Files with no row. scanStorage ignores anything under ten minutes old, so
      // a design whose row is still being inserted is never swept.
      const stats = await scanStorage(await allDesignPaths())
      let removed = 0
      for (const rel of stats.orphans) {
        await deleteDesign(rel).catch(() => {})
        removed += 1
      }
      return ok({ removed, orphans: stats.orphans.length })
    }

    return badRequest('Unknown action')
  } catch (err) {
    console.error('[vibe] admin designs action:', err)
    return serverError()
  }
}
