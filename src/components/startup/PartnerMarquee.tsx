'use client'

import { useState } from 'react'
import { PARTNERS, type Partner } from './data'

type Status = 'loading' | 'ok' | 'fail'

/**
 * Infinite logo marquee. Tiles fade in once their image loads and hide
 * themselves if the image is missing; if every logo fails (e.g. assets not yet
 * added to /public/brand/partners/), the whole strip removes itself.
 */
export function PartnerMarquee() {
  const [status, setStatus] = useState<Record<number, Status>>({})

  const allFailed = PARTNERS.every((_, i) => status[i] === 'fail')
  if (allFailed) return null

  const tile = (p: Partner, i: number, ariaHidden = false) => {
    const s = status[i]
    return (
      <span
        key={`${ariaHidden ? 'b' : 'a'}-${i}`}
        style={{
          display: s === 'fail' ? 'none' : 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 80,
          padding: '0 26px',
          background: '#fff',
          borderRadius: 14,
          boxShadow: '0 3px 14px rgba(0,0,0,.3)',
          flexShrink: 0,
          opacity: s === 'ok' ? 1 : 0,
          transition: 'opacity .35s ease',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.src}
          alt={ariaHidden ? '' : p.name}
          aria-hidden={ariaHidden || undefined}
          onLoad={() => setStatus((prev) => ({ ...prev, [i]: 'ok' }))}
          onError={() => setStatus((prev) => ({ ...prev, [i]: 'fail' }))}
          style={{
            maxHeight: 56,
            maxWidth: 220,
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </span>
    )
  }

  return (
    <div style={{ marginTop: 44 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '.16em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,.36)',
          marginBottom: 14,
        }}
      >
        Partner with &amp; backed by
      </div>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          WebkitMaskImage:
            'linear-gradient(90deg, transparent 0, #000 3%, #000 95%, transparent 100%)',
          maskImage:
            'linear-gradient(90deg, transparent 0, #000 3%, #000 95%, transparent 100%)',
        }}
      >
        <div className="hz-marquee-track">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingRight: 20 }}>
            {PARTNERS.map((p, i) => tile(p, i))}
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 20, paddingRight: 20 }}
            aria-hidden="true"
          >
            {PARTNERS.map((p, i) => tile(p, i, true))}
          </div>
        </div>
      </div>
    </div>
  )
}
