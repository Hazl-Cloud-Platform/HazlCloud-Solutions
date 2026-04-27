import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hazlsolutions.com'

export const metadata: Metadata = {
  title: {
    default: 'Insights - HAZL Solutions',
    template: '%s | HAZL Insights',
  },
  description:
    'Insights from HAZL Solutions on scaling AI-built products: DevOps, observability, security, infrastructure, and the operations side of running software at scale.',
  alternates: { canonical: '/insights' },
  openGraph: {
    type: 'website',
    url: `${siteUrl}/insights`,
    siteName: 'HAZL Solutions',
    title: 'Insights - HAZL Solutions',
    description:
      'Long-form analysis on AI-built products, DevOps, scaling, and the operations work that keeps software alive.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Insights - HAZL Solutions',
    description:
      'Long-form analysis on AI-built products, DevOps, scaling, and operations.',
  },
}

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return children
}
