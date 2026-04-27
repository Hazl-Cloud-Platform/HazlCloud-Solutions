import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hazlsolutions.com'

export const metadata: Metadata = {
  title: 'Our Approach - From MVP to Production-Ready',
  description:
    'Our 3-step approach to turning AI-built MVPs into reliable, scalable products: Assess weak points, Stabilize the system, and Scale for real users. We specialize in the operations side - cloud, infrastructure, observability, security, and uptime.',
  alternates: { canonical: '/approach' },
  openGraph: {
    type: 'article',
    url: '/approach',
    title: 'Our Approach - From MVP to Production-Ready | HAZL Solutions',
    description:
      'Dev is solved. Ops is where products fail. See how HAZL Solutions assesses, stabilizes, and scales AI-built products for real users.',
  },
  twitter: {
    title: 'Our Approach - From MVP to Production-Ready | HAZL Solutions',
    description:
      'Dev is solved. Ops is where products fail. See how HAZL Solutions assesses, stabilizes, and scales AI-built products.',
  },
}

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'From MVP to Production-Ready',
  description:
    'How HAZL Solutions turns fragile AI-built MVPs into reliable, scalable products through a three-step approach.',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Assess',
      text: 'Full review of your current system. Map every risk and weak point. Plain-language report - no jargon.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Stabilize',
      text: 'Fix the crashes and instability. Add monitoring, alerts, and backups. Close the security gaps.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Scale',
      text: 'Performance under real load. Reliable, observable infrastructure. Headroom for the next 10x.',
    },
  ],
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
    { '@type': 'ListItem', position: 2, name: 'Approach', item: `${siteUrl}/approach` },
  ],
}

export default function ApproachLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  )
}
