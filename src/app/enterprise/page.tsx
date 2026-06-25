import type { Metadata } from 'next'
import { SwitchAudienceBar } from '@/components/SwitchAudienceBar'
import { Hero } from '@/components/Hero'
import { ProblemSection } from '@/components/ProblemSection'
import { EnterpriseServices } from '@/components/enterprise/EnterpriseServices'
import { EnterpriseCta } from '@/components/enterprise/EnterpriseCta'
import { EnterpriseFooter } from '@/components/enterprise/EnterpriseFooter'

export const metadata: Metadata = {
  title: { absolute: 'HAZL Solutions — Your technical partner in scaling AI-built products' },
  description:
    'AI made building easy. Running software at scale is where things break. HAZL Solutions turns fragile MVPs into production-grade businesses — reliable, secure, observable, and ready for real users.',
  alternates: { canonical: '/enterprise' },
  openGraph: {
    url: '/enterprise',
    title: 'HAZL Solutions — Your technical partner in scaling AI-built products',
    description:
      'We turn fragile AI-built prototypes into reliable, scalable businesses. Operations, security, performance, and ongoing support for founders who built with AI.',
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
      <ProblemSection />
      <EnterpriseServices />
      <EnterpriseCta />
      <EnterpriseFooter />
    </main>
  )
}
