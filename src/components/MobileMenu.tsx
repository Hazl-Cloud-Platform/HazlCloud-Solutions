'use client'

import Link from 'next/link'

const NAV_LINKS = [
  { label: 'Approach', href: '/approach' },
  { label: 'Contact',  href: '#contact' },
]

export function MobileMenu({ open }: { open: boolean }) {
  return (
    <div
      className={[
        'lg:hidden absolute left-0 right-0 top-[72px] z-40',
        'bg-gray-900/95 backdrop-blur-lg border-t border-b border-gray-800 shadow-2xl',
        'transition-all duration-500 ease-out',
        open ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none',
      ].join(' ')}
    >
      <div className="flex flex-col px-4 py-3">
        {NAV_LINKS.map((link, i) => (
          <Link
            key={link.label}
            href={link.href}
            className={[
              'py-3 px-3 rounded-lg text-white text-base hover:bg-gray-800/50',
              'transition-all duration-500 ease-out',
              open ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0',
            ].join(' ')}
            style={{ transitionDelay: open ? `${i * 50}ms` : '0ms' }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
