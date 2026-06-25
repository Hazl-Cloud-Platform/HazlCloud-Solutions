import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const LABELS: Record<'startup' | 'enterprise', string> = {
  startup: 'Startup / small business',
  enterprise: 'Scale-up / enterprise',
}

/**
 * Inner row that labels which audience site you're on and links back to the
 * chooser at `/`. Mirrors the design's switch-audience affordance (minus the
 * "Prototype" wording). The caller supplies the sticky/blurred wrapper so this
 * can stack with a page nav inside a single sticky header.
 */
export function SwitchAudienceBar({ audience }: { audience: 'startup' | 'enterprise' }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '9px 5vw',
        borderBottom: '1px solid rgba(255,255,255,.1)',
        fontSize: 12.5,
      }}
    >
      <span style={{ color: 'rgba(255,255,255,.5)' }}>
        <span style={{ color: '#fff', fontWeight: 600 }}>{LABELS[audience]}</span> site
      </span>
      <Link
        href="/"
        className="switch-pill"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          background: 'rgba(255,255,255,.06)',
          border: '1px solid rgba(255,255,255,.16)',
          color: '#fff',
          borderRadius: 999,
          padding: '6px 13px',
          fontSize: 12.5,
          fontWeight: 500,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <ArrowLeft size={14} strokeWidth={2} />
        Switch audience
      </Link>
    </div>
  )
}
