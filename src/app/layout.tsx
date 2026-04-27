import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'HAZL Solutions - Your technical partner in scaling AI-built products',
  description:
    'HAZL Solutions turns fragile AI-built prototypes into reliable, scalable businesses. Operations, security, performance, and ongoing support for founders who built with AI.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-black text-white antialiased">{children}</body>
    </html>
  )
}
