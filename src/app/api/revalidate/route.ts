import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { parseBody } from 'next-sanity/webhook'

type WebhookBody = {
  _type?: string
  slug?: { current?: string } | string
}

const SECRET = process.env.SANITY_REVALIDATE_SECRET

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!SECRET) {
    return NextResponse.json(
      { ok: false, error: 'SANITY_REVALIDATE_SECRET is not configured' },
      { status: 500 }
    )
  }

  try {
    const { isValidSignature, body } = await parseBody<WebhookBody>(req, SECRET)

    if (!isValidSignature) {
      return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 })
    }
    if (!body) {
      return NextResponse.json({ ok: false, error: 'Empty body' }, { status: 400 })
    }

    const type = body._type
    const slug = typeof body.slug === 'string' ? body.slug : body.slug?.current

    if (type === 'insight') {
      revalidateTag('insights')
      revalidatePath('/insights')
      revalidatePath('/sitemap.xml')
      if (slug) {
        revalidateTag(`insight:${slug}`)
        revalidatePath(`/insights/${slug}`)
      }
    }

    return NextResponse.json({ ok: true, revalidated: true, type, slug })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
