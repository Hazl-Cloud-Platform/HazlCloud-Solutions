'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { CTA_URL } from './data'

const LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#examples', label: 'What we build' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
]

export function StartupNav() {
  const [open, setOpen] = useState(false)

  return (
    <nav
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 5vw',
        borderBottom: '1px solid rgba(255,255,255,.1)',
      }}
    >
      <a
        href="#top"
        onClick={() => setOpen(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/hazlCloud-logo-bw2.png"
          alt="HAZL Solutions"
          width={32}
          height={32}
          style={{ width: 32, height: 32 }}
        />
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.03em' }}>HAZL</span>
        <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-.03em', color: 'rgba(255,255,255,.45)' }}>
          SOLUTIONS
        </span>
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="startup-nav-links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hz-link" style={{ fontSize: 14 }}>
              {l.label}
            </a>
          ))}
          <a
            href={CTA_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-accent startup-nav-cta"
            style={{ borderRadius: 8, padding: '10px 18px', fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            Book a free call
          </a>
        </div>

        {/* Mobile menu toggle (shown ≤760px via CSS) */}
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="startup-nav-toggle"
          style={{
            width: 38,
            height: 38,
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,.16)',
            background: 'rgba(255,255,255,.06)',
            color: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile dropdown panel */}
      {open && (
        <div
          className="startup-nav-panel"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '100%',
            background: 'rgba(0,0,0,.96)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,.1)',
            display: 'flex',
            flexDirection: 'column',
            padding: '8px 5vw 18px',
          }}
        >
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="hz-link"
              style={{ fontSize: 16, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.07)' }}
            >
              {l.label}
            </a>
          ))}
          <a
            href={CTA_URL}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className="btn-accent"
            style={{
              marginTop: 14,
              borderRadius: 8,
              padding: '12px 18px',
              fontSize: 14.5,
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            Book a free call
          </a>
        </div>
      )}
    </nav>
  )
}
