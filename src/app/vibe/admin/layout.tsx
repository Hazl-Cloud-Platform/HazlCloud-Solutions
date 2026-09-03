import type { Metadata } from 'next'

/** Kept out of every index. robots.ts also disallows /vibe, but a page-level
 *  directive survives a crawler that ignores robots.txt. */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  title: { absolute: 'Vibe Studio admin' },
}

export default function VibeAdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-black text-white">{children}</div>
}
