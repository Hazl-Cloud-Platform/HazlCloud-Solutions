import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hazlsolutions.com'

export const metadata: Metadata = {
  title: 'Our Approach - Assess, Implement, Operate',
  // Kept under 160 characters so search results and link previews show it whole.
  description:
    'Our three-step approach: assess what your teams have built, implement sandboxes, CI/CD, IaC and guardrails, then operate it day to day.',
  alternates: { canonical: '/approach' },
  openGraph: {
    type: 'article',
    url: '/approach',
    title: 'Our Approach - Assess, Implement, Operate | HAZL Solutions',
    description:
      'Dev is solved. Ops is where products fail. See how HAZL Solutions assesses, implements and operates the AI-built and legacy apps your teams depend on.',
  },
  twitter: {
    title: 'Our Approach - Assess, Implement, Operate | HAZL Solutions',
    description:
      'Dev is solved. Ops is where products fail. See how HAZL Solutions assesses, implements and operates the apps your teams build.',
  },
}

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'From laptop apps to a governed platform',
  description:
    'How HAZL Solutions takes the AI-built and legacy apps enterprise teams build from laptop to governed production, through a three-step approach.',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Assess',
      text: 'Inventory every app, pipeline and data connection. Map risk, cost and ownership. Plain-language roadmap - no jargon.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Implement',
      text: 'Sandboxes, CI/CD and infrastructure as code. SSO, guardrails and alerts. Budgets and usage telemetry.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Operate',
      text: 'Monitoring, on-call and backups. Patching and cost tuning. Hand-over or managed services.',
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
