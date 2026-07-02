import type { Metadata } from 'next'
import { StartupLanding } from '@/components/startup/StartupLanding'
import { FAQS } from '@/components/startup/data'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hazlsolutions.com'

export const metadata: Metadata = {
  title: { absolute: 'Affordable software development from $80/mo — HAZL Solutions' },
  description:
    'Affordable, done-for-you software development for founders and small businesses. We design, build, secure & run a revenue-ready app — or fix your AI-built prototype — from $80/month CAD, live in 2 weeks, no upfront cost. Canadian team; your data stays secure.',
  keywords: [
    'affordable software development',
    'cheap software development',
    'software development for startups',
    'done-for-you app development',
    'software development company Canada',
    'affordable app development',
    'build a SaaS without coding',
    'app for non-technical founders',
    'MVP development Canada',
    'no upfront cost app',
    '$80 a month app',
    'startup app builder',
    'managed app hosting',
    'fix an AI-built app',
    'make AI app production ready',
    'launch a vibe-coded app',
  ],
  alternates: { canonical: '/startup' },
  openGraph: {
    type: 'website',
    url: '/startup',
    siteName: 'HAZL Solutions',
    title: 'Affordable software development, done-for-you — from $80/month',
    description:
      'Affordable, done-for-you software development. Start from an idea, or bring an AI-built app that isn’t market-ready — we design, fix, secure & scale it into a revenue-ready product. Live in 2 weeks, $80/month CAD, nothing upfront. Built & hosted in Canada.',
    // og:image supplied by ./opengraph-image.tsx ($80 tile, 1200×630).
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Affordable software development, done-for-you — from $80/month',
    description:
      'Affordable, done-for-you software development. Start from an idea, or bring an AI-built app that isn’t market-ready — we design, fix, secure & scale it into a revenue-ready product. Live in 2 weeks, $80/month CAD, nothing upfront.',
    // twitter:image falls back to the per-route og:image.
  },
}

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Affordable software development, done-for-you',
  serviceType: 'Affordable software development, app build, hosting and maintenance',
  category: 'Software Development',
  provider: { '@type': 'Organization', name: 'HAZL Solutions', url: siteUrl },
  areaServed: { '@type': 'Country', name: 'Canada' },
  description:
    'Affordable, done-for-you software development: HAZL builds a real, revenue-ready app for non-technical founders — or productionizes an AI-built prototype — and runs it end-to-end on HAZL Cloud (hosting, security, backups, updates and scaling) for one low monthly price.',
  offers: {
    '@type': 'Offer',
    priceCurrency: 'CAD',
    price: '80',
    availability: 'https://schema.org/InStock',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: '80',
      priceCurrency: 'CAD',
      unitText: 'per month',
      referenceQuantity: { '@type': 'QuantitativeValue', value: '1', unitCode: 'MON' },
    },
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Affordable software development for startups',
      item: `${siteUrl}/startup`,
    },
  ],
}

export default function StartupPage() {
  return (
    <>
      <StartupLanding />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  )
}
