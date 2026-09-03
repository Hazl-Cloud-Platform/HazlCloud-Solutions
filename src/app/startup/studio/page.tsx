import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { StudioShell } from '@/components/vibe/StudioShell'

/** The VIBE_ENABLED check must run per request. Without force-dynamic Next would
 *  prerender this page at build time and bake the flag's build-time value in. */
export const dynamic = 'force-dynamic'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.hazlsolutions.com'

export const metadata: Metadata = {
  title: { absolute: 'Try it now — build a working-looking app in a minute | HAZL Solutions' },
  description:
    'Describe the app you wish existed and watch a real interface appear. A free preview from HAZL Solutions — then a real person builds the secure, scalable version.',
  alternates: { canonical: '/startup/studio' },
  openGraph: {
    title: 'Try it now — HAZL Studio',
    description: 'Describe the app you wish existed and watch a real interface appear.',
    url: `${siteUrl}/startup/studio`,
    type: 'website',
  },
}

export default function StudioPage() {
  // The studio needs a persistent filesystem and runs far past a serverless
  // function's ceiling, so it stays dark until the VM deployment is live.
  if (process.env.VIBE_ENABLED !== '1') notFound()

  return <StudioShell turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null} />
}
