import type { Metadata } from 'next'
import { Hero } from '@/components/Hero'
import { ProblemSection } from '@/components/ProblemSection'

export const metadata: Metadata = {
  title: 'HAZL Solutions - Your technical partner in scaling AI-built products',
  description:
    'AI made building easy. Running software at scale is where things break. HAZL Solutions turns fragile MVPs into production-grade businesses - reliable, secure, observable, and ready for real users.',
  alternates: { canonical: '/' },
  openGraph: {
    url: '/',
    title: 'HAZL Solutions - Your technical partner in scaling AI-built products',
    description:
      'We turn fragile AI-built prototypes into reliable, scalable businesses. Operations, security, performance, and ongoing support for founders who built with AI.',
  },
}

export default function Home() {
  return (
    <main>
      <Hero />
      <ProblemSection />
    </main>
  )
}
