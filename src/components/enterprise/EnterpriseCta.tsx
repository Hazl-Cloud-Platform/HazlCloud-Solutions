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
        <div style={{ maxWidth: 620 }}>
          <h2
            style={{
              fontSize: 'clamp(26px,3.4vw,38px)',
              lineHeight: 1.06,
              letterSpacing: '-.03em',
              fontWeight: 500,
              margin: 0,
            }}
          >
            Bring us the app sprawl. We&rsquo;ll bring the DevOps team.
          </h2>
          <p
            style={{
              fontSize: 15.5,
              lineHeight: 1.55,
              color: 'rgba(255,255,255,.58)',
              margin: '14px 0 0',
            }}
          >
            Start with a DevOps assessment: we map what your teams have built, what is risky, and
            what it takes to run it properly.
          </p>
        </div>
        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noreferrer"
          className="pill-cta"
          style={{ flexShrink: 0 }}
        >
          Book a DevOps assessment
          <ArrowRight size={17} />
        </a>
      </div>
    </section>
  )
}
