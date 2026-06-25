import { ArrowRight } from 'lucide-react'

const CALENDLY_URL = 'https://calendly.com/anthony-tam-hazl/30min'

export function EnterpriseCta() {
  return (
    <section style={{ borderTop: '1px solid rgba(255,255,255,.1)', padding: '64px 5vw' }}>
      <div
        style={{
          maxWidth: 1160,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 30,
          flexWrap: 'wrap',
        }}
      >
        <h2
          style={{
            fontSize: 'clamp(26px,3.4vw,38px)',
            lineHeight: 1.06,
            letterSpacing: '-.03em',
            fontWeight: 500,
            margin: 0,
            maxWidth: 620,
          }}
        >
          From prototype to production-ready — without rewriting from scratch.
        </h2>
        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noreferrer"
          className="pill-cta"
          style={{ flexShrink: 0 }}
        >
          Book a discovery call
          <ArrowRight size={17} />
        </a>
      </div>
    </section>
  )
}
