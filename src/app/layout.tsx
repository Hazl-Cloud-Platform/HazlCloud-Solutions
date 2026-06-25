import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const GA_MEASUREMENT_ID = 'G-3BR9J81J1Q'

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
    default: 'HAZL Solutions — Build or scale your app',
    template: '%s | HAZL Solutions',
  },
  description:
    'HAZL Solutions designs, builds, and runs revenue-ready apps for non-technical founders and small businesses — and turns fragile AI-built products into reliable, scalable businesses for growing teams.',
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
    title: 'HAZL Solutions — Build or scale your app',
    description:
      'We design, build, and run revenue-ready apps for founders, and turn fragile AI-built prototypes into reliable, scalable businesses for growing teams.',
    // og:image is supplied per-route by opengraph-image.tsx (generated 1200×630).
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HAZL Solutions — Build or scale your app',
    description:
      'We design, build, and run revenue-ready apps for founders, and turn fragile AI-built prototypes into reliable, scalable businesses.',
    // twitter:image falls back to the per-route og:image.
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
    icon: '/brand/favicon.png',
    shortcut: '/brand/favicon.png',
    apple: '/brand/favicon.png',
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
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body className="font-sans bg-black text-white antialiased">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
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
