import { currentAdmin } from '@/lib/vibe/adminAuth'
import { getDesignHtml, removeDesign } from '@/lib/vibe/designs'
import { assertSameOrigin, forbidden, notFound, ok, serverError, unauthorized } from '@/lib/vibe/http'
import { MissingDesignError } from '@/lib/vibe/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: { designId: string } }

/**
 * Returns the stored document as JSON for the admin preview.
 *
 * Deliberately NOT a text/html route. Serving visitor-authored HTML from our own
 * origin would make one missing response header a same-origin XSS endpoint against
 * a signed-in admin. The client renders this into an iframe WITHOUT allow-scripts,
 * so nothing in it executes in an authenticated tab at all.
 */
export async function GET(_req: Request, { params }: Params) {
  if (!(await currentAdmin())) return unauthorized()
  try {
    const found = await getDesignHtml(params.designId)
    if (!found) return notFound('No such design')
    return ok({ design: found.row, html: found.html })
  } catch (err) {
    if (err instanceof MissingDesignError) {
      return ok({ design: null, html: null, missing: true })
    }
    console.error('[vibe] admin design read:', err)
    return serverError()
  }
}

export async function DELETE(req: Request, { params }: Params) {
  if (!(await currentAdmin())) return unauthorized()
  if (!assertSameOrigin(req)) return forbidden('Cross-origin requests are not allowed')
  try {
    const removed = await removeDesign(params.designId)
    if (!removed) return notFound('No such design')
    return ok({})
  } catch (err) {
    console.error('[vibe] admin design delete:', err)
    return serverError('Could not delete the file — the record was kept.')
  }
}
