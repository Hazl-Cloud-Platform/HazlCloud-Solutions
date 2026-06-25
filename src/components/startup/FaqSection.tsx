'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { FAQS } from './data'

export function FaqSection() {
  const [open, setOpen] = useState(-1)

  return (
    <div
      id="faq"
      style={{
        scrollMarginTop: 128,
        borderTop: '1px solid rgba(255,255,255,.1)',
        background: 'linear-gradient(180deg, rgba(255,255,255,.015), transparent)',
      }}
    >
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '64px 32px' }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.4)',
          }}
        >
          05 — Honest answers
        </div>
        <h2
          style={{
            fontSize: 'clamp(30px,4vw,40px)',
            lineHeight: 1.05,
            letterSpacing: '-.035em',
            fontWeight: 700,
            margin: '16px 0 32px',
          }}
        >
          Questions founders actually ask.
        </h2>

        {FAQS.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={f.q} style={{ borderBottom: '1px solid rgba(255,255,255,.12)' }}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="faq-trigger"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 20,
                  padding: '22px 0',
                  cursor: 'pointer',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  textAlign: 'left',
                  font: 'inherit',
                }}
              >
                <span
                  style={{
                    fontSize: 'clamp(16px,2vw,18px)',
                    fontWeight: 600,
                    letterSpacing: '-.01em',
                  }}
                >
                  {f.q}
                </span>
                <span
                  style={{
                    flexShrink: 0,
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                  }}
                >
                  {isOpen ? (
                    <Minus size={15} strokeWidth={2.2} />
                  ) : (
                    <Plus size={15} strokeWidth={2.2} />
                  )}
                </span>
              </button>
              {isOpen && (
                <div
                  style={{
                    padding: '0 0 24px',
                    fontSize: 15.5,
                    color: 'rgba(255,255,255,.62)',
                    lineHeight: 1.6,
                    maxWidth: 680,
                  }}
                >
                  {f.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
