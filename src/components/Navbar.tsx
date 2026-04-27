'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
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
          <LogoMark className="w-8 h-8 md:w-9 md:h-9" />
          <span className="text-white font-semibold tracking-[-0.04em] text-2xl md:text-[28px] leading-none">
            HAZL
          </span>
          <span className="text-white/50 text-[10px] md:text-xs tracking-[0.2em] uppercase">
            Solutions
          </span>
        </a>

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
