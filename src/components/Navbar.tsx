'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Newspaper } from 'lucide-react'
import { LogoMark } from './LogoMark'
import { MobileMenu } from './MobileMenu'

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <nav className="relative z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 md:py-6">
        <a
          href="/"
          className="animate-blur-fade-up flex items-center gap-2.5 select-none"
          style={{ animationDelay: '0ms' }}
        >
          <LogoMark className="w-12 h-12 md:w-14 md:h-14" />
          <span className="text-white font-semibold tracking-[-0.04em] text-2xl md:text-[28px] leading-none">
            HAZL
          </span>
          <span className="text-white/50 font-semibold tracking-[-0.04em] text-2xl md:text-[28px] leading-none uppercase">
            Solutions
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-6 text-sm text-white/85">
          <Link
            href="/insights"
            aria-label="Insights"
            className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/25 text-white transition-colors animate-blur-fade-up"
            style={{ animationDelay: '200ms' }}
          >
            <Newspaper size={24} strokeWidth={1.6} />
          </Link>
        </div>

        {/* hamburger - only below lg, hidden by design but wired for mobile */}
        <button
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
          className="lg:hidden liquid-glass w-10 h-10 rounded-full flex items-center justify-center text-white animate-blur-fade-up"
          style={{ animationDelay: '350ms' }}
        >
          <span className="relative w-[18px] h-[18px] block">
            <Menu
              size={18}
              className={`absolute inset-0 transition-all duration-500 ease-out ${
                menuOpen ? 'rotate-180 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'
              }`}
            />
            <X
              size={18}
              className={`absolute inset-0 transition-all duration-500 ease-out ${
                menuOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-180 opacity-0 scale-50'
              }`}
            />
          </span>
        </button>
      </nav>

      <MobileMenu open={menuOpen} />
    </>
  )
}
