import type { Metadata } from 'next'
import { StartupLanding } from '@/components/startup/StartupLanding'
import { FAQS } from '@/components/startup/data'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hazlsolutions.com'

export const metadata: Metadata = {
  title: { absolute: 'Launch a real app from $80/month — HAZL Solutions (Canada)' },
  description:
    'HAZL Solutions designs, builds, and runs a real, revenue-ready app for non-technical founders and small businesses. Live in 2 weeks, from $80/month CAD, with no upfront cost. Canadian team — your data stays secure.',
  keywords: [
    'build a SaaS without coding',
    'app for non-technical founders',
    'MVP development Canada',
    'no upfront cost app',
    '$80 a month app',
    'startup app builder',
    'managed app hosting',
  ],
  alternates: { canonical: '/startup' },
  openGraph: {
    type: 'website',
    url: '/startup',
    siteName: 'HAZL Solutions',
    title: 'Launch a real app your customers pay for — from $80/month',
    description:
      'We design, build, and run a revenue-ready app for you. Live in 2 weeks, $80/month CAD, nothing upfront. Built & hosted in Canada.',
    // og:image supplied by ./opengraph-image.tsx ($80 tile, 1200×630).
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Launch a real app your customers pay for — from $80/month',
    description:
      'We design, build, and run a revenue-ready app for you. Live in 2 weeks, $80/month CAD, nothing upfront.',
    // twitter:image falls back to the per-route og:image.
  },
}

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Done-for-you app build, hosting and maintenance',
  provider: { '@type': 'Organization', name: 'HAZL Solutions', url: siteUrl },
  areaServed: { '@type': 'Country', name: 'Canada' },
  description:
    'HAZL builds a real, revenue-ready app for non-technical founders and runs it end-to-end on HAZL Cloud — hosting, security, backups, updates and scaling — for one low monthly price.',
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
    </>
  )
}
