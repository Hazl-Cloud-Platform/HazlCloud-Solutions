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
  'DevOps consulting & implementation: 60+ engineers who embed as forward-deployed engineers (FDE), second into your team, or run it as a managed service.'

export const metadata: Metadata = {
  title: { absolute: 'HAZL Solutions — DevOps consulting & implementation' },
  description: DESCRIPTION,
  alternates: { canonical: '/enterprise' },
  openGraph: {
    url: '/enterprise',
    title: 'HAZL Solutions — DevOps consulting & implementation',
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
    </main>
  )
}
