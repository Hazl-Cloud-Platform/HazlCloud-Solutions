import type { Metadata } from 'next'
import { SwitchAudienceBar } from '@/components/SwitchAudienceBar'
import { Hero } from '@/components/Hero'
import { ProblemSection } from '@/components/ProblemSection'
import { EnterpriseStats } from '@/components/enterprise/EnterpriseStats'
import { EnterpriseServices } from '@/components/enterprise/EnterpriseServices'
import { EngagementModels } from '@/components/enterprise/EngagementModels'
import { MaturityLadder } from '@/components/enterprise/MaturityLadder'
import { EnterprisePartners } from '@/components/enterprise/EnterprisePartners'
import { EnterpriseCta } from '@/components/enterprise/EnterpriseCta'
import { EnterpriseFooter } from '@/components/enterprise/EnterpriseFooter'

// Kept under 160 characters so search results and link previews show it whole.
const DESCRIPTION =
  'DevOps consulting & implementation — your gateway from laptop to production. 60+ engineers as forward-deployed engineers, secondment or managed services.'

const TITLE = 'DevOps consulting: your gateway from laptop to production | HAZL Solutions'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hazlsolutions.com'

// Describes the enterprise offer for search engines and LLM crawlers; the
// claims mirror the page copy (headcount, engagement models, location) only.
const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'HAZL Solutions — DevOps consulting & implementation',
  slogan: 'Your gateway from laptop to production.',
  url: `${siteUrl}/enterprise`,
  description:
    'DevOps consulting and implementation for enterprises and IT teams. 60+ developers and DevOps engineers take AI-built and legacy apps from laptops to governed production through forward-deployed engineers, secondment, or managed services.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Calgary',
    addressRegion: 'AB',
    addressCountry: 'CA',
  },
  areaServed: { '@type': 'Country', name: 'Canada' },
  knowsAbout: [
    'DevOps',
    'CI/CD',
    'Infrastructure as code',
    'Platform engineering',
    'Site reliability engineering',
    'DevSecOps',
    'FinOps',
    'AI app governance',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Engagement models',
    itemListElement: [
      'Forward-deployed engineers',
      'Secondment',
      'Managed services',
    ].map((name) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name } })),
  },
}

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/enterprise' },
  openGraph: {
    url: '/enterprise',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    title: TITLE,
    description: DESCRIPTION,
  },
}

export default function EnterprisePage() {
  return (
    <main id="main-content">
      {/*
        Audience bar sits above the existing enterprise hero. It is intentionally
        NOT sticky here: the reused <Hero> keeps its nav transparent over the
        video (faithful to the live site), so a non-sticky bar scrolls away with
        that nav instead of leaving an orphaned strip / colliding z-indexes.
      */}
      <div style={{ background: '#000' }}>
        <SwitchAudienceBar audience="enterprise" />
      </div>

      <Hero />
      <EnterpriseStats />
      <ProblemSection />
      <EnterpriseServices />
      <EngagementModels />
      <MaturityLadder />
      <EnterprisePartners />
      <EnterpriseCta />
      <EnterpriseFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
    </main>
  )
}
