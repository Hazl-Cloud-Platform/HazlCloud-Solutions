import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const GA_MEASUREMENT_ID = 'G-3BR9J81J1Q'

/**
 * Cloudflare Web Analytics beacon (Johnny@hazl.ca's account, site www.hazlsolutions.com).
 *
 * Deliberately ONE token. The beacon initialises once per page --
 * window.__cfBeacon is set by the first instance and later scripts are
 * ignored -- so a second token for another Cloudflare account would
 * silently never report. Share this data by adding the other account as a
 * member of the account that owns the zone, not by adding a second beacon.
 *
 * Not a secret: it is public in the page source by design.
 */
const CF_BEACON_TOKEN = 'a3e52cdb27394e459f445363dde5f11c'

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
    'HAZL Solutions designs, builds, and runs revenue-ready apps for non-technical founders and small businesses — and delivers DevOps consulting and implementation for enterprises through forward-deployed engineers, secondment, and managed services.',
  applicationName: 'HAZL Solutions',
  authors: [{ name: 'HAZL Solutions' }],
  creator: 'HAZL Solutions',
  publisher: 'HAZL Solutions',
  generator: 'Next.js',
  keywords: [
    'HAZL Solutions',
    'HazlCloud',
    'DevOps consulting',
    'DevOps implementation',
    'DevOps gateway',
    'laptop to production',
    'forward deployed engineers',
    'IT staff secondment',
    'managed DevOps services',
    'platform engineering',
    'AI app governance',
    'citizen developer governance',
    'vibe-coded apps',
    'CI/CD',
    'infrastructure as code',
    'FinOps',
    'AI prototype to production',
    'DevOps for startups',
    'cloud operations',
    'infrastructure consulting',
    'observability',
    'site reliability',
    'uptime',
    'app security',
    'production readiness',
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
      'We design, build, and run revenue-ready apps for founders, and deliver DevOps consulting and implementation for enterprise IT teams — embedded, seconded, or managed.',
    // og:image is supplied per-route by opengraph-image.tsx (generated 1200×630).
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HAZL Solutions — Build or scale your app',
    description:
      'We design, build, and run revenue-ready apps for founders, and deliver DevOps consulting and implementation for enterprise IT teams.',
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
    'HAZL Solutions builds and runs revenue-ready apps for founders and small businesses, and provides DevOps consulting and implementation for enterprises — cloud, CI/CD, infrastructure as code, observability, security and governance — delivered by forward-deployed engineers, secondment, or managed services.',
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
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          strategy="afterInteractive"
          data-cf-beacon={`{"token": "${CF_BEACON_TOKEN}"}`}
        />
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
