import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hazlsolutions.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'HAZL Solutions - Your technical partner in scaling AI-built products',
    template: '%s | HAZL Solutions',
  },
  description:
    'HAZL Solutions turns fragile AI-built prototypes into reliable, scalable businesses. We specialize in operations: cloud, infrastructure, observability, security, uptime, and recovery for founders who built with AI.',
  applicationName: 'HAZL Solutions',
  authors: [{ name: 'HAZL Solutions' }],
  creator: 'HAZL Solutions',
  publisher: 'HAZL Solutions',
  generator: 'Next.js',
  keywords: [
    'HAZL Solutions',
    'HazlCloud',
    'AI MVP scaling',
    'AI prototype to production',
    'DevOps for startups',
    'cloud operations',
    'infrastructure consulting',
    'observability',
    'site reliability',
    'uptime',
    'app security',
    'production readiness',
    'technical partner',
    'fractional CTO',
    'platform engineering',
    'AI development',
    'technical consulting',
    'software development partner',
    'SRE',
  ],
  category: 'technology',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'HAZL Solutions',
    title: 'HAZL Solutions - Your technical partner in scaling AI-built products',
    description:
      'We turn fragile AI-built prototypes into reliable, scalable businesses. Cloud, infrastructure, observability, security, and uptime for AI-built products.',
    images: [
      {
        url: '/brand/hazlCloud-logo-bw2.png',
        width: 1024,
        height: 1024,
        alt: 'HAZL Solutions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HAZL Solutions - Your technical partner in scaling AI-built products',
    description:
      'We turn fragile AI-built prototypes into reliable, scalable businesses. Operations, security, performance, and ongoing support.',
    images: ['/brand/hazlCloud-logo-bw2.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/brand/hazlCloud-logo-bw2.png',
    shortcut: '/brand/hazlCloud-logo-bw2.png',
    apple: '/brand/hazlCloud-logo-bw2.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'HAZL Solutions',
  url: siteUrl,
  logo: `${siteUrl}/brand/hazlCloud-logo-bw2.png`,
  description:
    'HAZL Solutions turns fragile AI-built prototypes into reliable, scalable businesses through operations, security, infrastructure, and uptime engineering.',
  sameAs: ['https://hazlcloud.com'],
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'HAZL Solutions',
  url: siteUrl,
  inLanguage: 'en',
  publisher: { '@type': 'Organization', name: 'HAZL Solutions' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-black text-white antialiased">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </body>
    </html>
  )
}
