import type { Metadata } from 'next'
import Link from 'next/link'
import { Lightbulb, Building2, ArrowRight } from 'lucide-react'
import { LogoMark } from '@/components/LogoMark'

export const metadata: Metadata = {
  title: { absolute: 'HAZL Solutions — Build or scale your app' },
  description:
    'HAZL Solutions designs, builds, and runs revenue-ready apps for non-technical founders and small businesses — and scales production apps for growing teams. Tell us what you’re building.',
  alternates: { canonical: '/' },
  openGraph: {
    url: '/',
    title: 'HAZL Solutions — Build or scale your app',
    description:
      'We work with two kinds of teams: founders launching their first revenue-ready app, and scale-ups hardening a product for real load. Pick the one that sounds like you.',
  },
}

export default function ChooserPage() {
  return (
    <main
      id="main-content"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#000',
        color: '#fff',
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(80% 60% at 50% -6%, rgba(244,211,94,.10), transparent 55%)',
        }}
      />

      {/* Brand */}
      <header
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '30px 6vw',
        }}
      >
        <LogoMark className="w-[34px] h-[34px]" />
        <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-.03em' }}>HAZL</span>
        <span
          style={{
            fontSize: 19,
            fontWeight: 600,
            letterSpacing: '-.03em',
            color: 'rgba(255,255,255,.42)',
          }}
        >
          SOLUTIONS
        </span>
      </header>

      {/* Chooser */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '20px 6vw 30px',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
          }}
        >
          Welcome
        </div>
        <h1
          style={{
            fontSize: 'clamp(34px,6vw,56px)',
            lineHeight: 1.04,
            letterSpacing: '-.04em',
            fontWeight: 600,
            margin: '16px 0 0',
          }}
        >
          What are you building?
        </h1>
        <p
          style={{
            fontSize: 'clamp(16px,2.1vw,19px)',
            color: 'rgba(255,255,255,.62)',
            margin: '16px 0 0',
            maxWidth: 540,
          }}
        >
          We work with two kinds of teams. Pick the one that sounds like you — we’ll take you to
          the right place.
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 22,
            marginTop: 44,
            width: '100%',
            maxWidth: 900,
          }}
        >
          {/* Startup */}
          <Link
            href="/startup"
            className="chooser-card chooser-card--startup"
            style={{
              flex: '1 1 360px',
              maxWidth: 430,
              textAlign: 'left',
              position: 'relative',
              padding: '30px 28px 26px',
              borderRadius: 18,
              background:
                'linear-gradient(180deg, rgba(244,211,94,.10), rgba(244,211,94,.02))',
              border: '1px solid rgba(244,211,94,.42)',
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                background: 'rgba(244,211,94,.14)',
                border: '1px solid rgba(244,211,94,.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <Lightbulb size={24} strokeWidth={1.7} />
            </div>
            <div
              style={{
                fontSize: 23,
                fontWeight: 600,
                letterSpacing: '-.02em',
                marginTop: 20,
              }}
            >
              Startup or small business
            </div>
            <div
              style={{
                fontSize: 14.5,
                color: 'rgba(255,255,255,.66)',
                marginTop: 9,
                lineHeight: 1.5,
              }}
            >
              I have an idea — or a rough AI-built app — and I want to launch a real product people
              pay for.
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 22,
                paddingTop: 18,
                borderTop: '1px solid rgba(255,255,255,.1)',
              }}
            >
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--accent)' }}>
                From $80/mo · live in 2 weeks
              </span>
              <span style={{ flex: 1 }} />
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Start here
                <ArrowRight size={17} strokeWidth={2.2} />
              </span>
            </div>
          </Link>

          {/* Enterprise */}
          <Link
            href="/enterprise"
            className="chooser-card chooser-card--enterprise liquid-glass"
            style={{
              flex: '1 1 360px',
              maxWidth: 430,
              textAlign: 'left',
              position: 'relative',
              padding: '30px 28px 26px',
              borderRadius: 18,
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 12,
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building2 size={24} strokeWidth={1.6} />
            </div>
            <div
              style={{
                fontSize: 23,
                fontWeight: 600,
                letterSpacing: '-.02em',
                marginTop: 20,
              }}
            >
              Scale-up or enterprise
            </div>
            <div
              style={{
                fontSize: 14.5,
                color: 'rgba(255,255,255,.66)',
                marginTop: 9,
                lineHeight: 1.5,
              }}
            >
              I already have a product. I have &gt;300 paid users and I need it reliable, secure,
              and ready to scale under real load.
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 22,
                paddingTop: 18,
                borderTop: '1px solid rgba(255,255,255,.1)',
              }}
            >
              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,.55)' }}>
                Our current approach
              </span>
              <span style={{ flex: 1 }} />
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                View our work
                <ArrowRight size={17} strokeWidth={2.2} />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}
