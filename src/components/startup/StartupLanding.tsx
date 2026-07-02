import {
  ArrowRight,
  Leaf,
  Check,
  Lightbulb,
  Unplug,
  TrendingUp,
  Cloud,
  RefreshCw,
  CalendarCheck,
  Store,
  LayoutDashboard,
  Repeat,
  List,
  Table2,
  type LucideIcon,
} from 'lucide-react'
import { SwitchAudienceBar } from '@/components/SwitchAudienceBar'
import { StartupNav } from './StartupNav'
import { PartnerMarquee } from './PartnerMarquee'
import { FaqSection } from './FaqSection'
import { CTA_URL, HANDLES, TIMELINE, INCLUDED } from './data'

const EYEBROW: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,.4)',
}

const SECTION_H2: React.CSSProperties = {
  fontSize: 'clamp(30px,4vw,40px)',
  lineHeight: 1.05,
  letterSpacing: '-.035em',
  fontWeight: 700,
}

type Example = { icon: LucideIcon; title: string; body: string }

const EXAMPLES: Example[] = [
  {
    icon: CalendarCheck,
    title: 'Booking & scheduling',
    body: 'Clients pick a slot and pay you online. Calendars, reminders, deposits.',
  },
  {
    icon: Store,
    title: 'Online marketplace',
    body: 'Buyers and sellers in one place, with payments and payouts handled.',
  },
  {
    icon: LayoutDashboard,
    title: 'Customer portal',
    body: 'Logins, dashboards, and self-serve accounts for the people you serve.',
  },
  {
    icon: Repeat,
    title: 'Subscription product',
    body: 'Recurring billing and members-only access — income that repeats every month.',
  },
  {
    icon: List,
    title: 'Directory or listings',
    body: 'Searchable, filterable listings you can charge to join or to feature.',
  },
  {
    icon: Table2,
    title: 'Internal tool',
    body: 'Replace the messy spreadsheet that’s quietly running your business.',
  },
]

const PLAIN_STEPS = [
  {
    n: '01',
    icon: Lightbulb,
    title: 'You bring the idea',
    body: 'A sketch, a few sentences, or a rough app you made with AI. No technical knowledge needed.',
  },
  {
    n: '02',
    icon: Unplug,
    title: 'We build & run it',
    body: 'Payments, logins, data, security, hosting — all of it. Then we keep it online and improving.',
  },
  {
    n: '03',
    icon: TrendingUp,
    title: 'You get paying customers',
    body: 'A live product people can sign up for and pay you for — in about two weeks, for $80 a month.',
  },
]

export function StartupLanding() {
  return (
    <div style={{ background: '#000', color: '#fff', minHeight: '100vh' }}>
      {/* ── Sticky header: switch bar + nav ─────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 60,
          background: 'rgba(0,0,0,.72)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <SwitchAudienceBar audience="startup" />
        <StartupNav />
      </header>

      <main id="main-content">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section id="top" style={{ position: 'relative', overflow: 'hidden' }}>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -60,
            right: -80,
            width: 620,
            height: 620,
            background: 'radial-gradient(circle at center, rgba(244,211,94,.16), transparent 62%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 1160, margin: '0 auto', padding: '72px 32px 64px' }}>
          <div style={{ display: 'flex', gap: 48, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 520px', minWidth: 300 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: 'var(--accent)',
                  border: '1px solid rgba(244,211,94,.4)',
                  borderRadius: 999,
                  padding: '6px 13px',
                }}
              >
                No code · no jargon · no upfront cost
              </div>
              <h1
                style={{
                  fontSize: 'clamp(40px,6.2vw,66px)',
                  lineHeight: 0.98,
                  letterSpacing: '-.045em',
                  fontWeight: 700,
                  margin: '22px 0 0',
                }}
              >
                Turn your idea — or AI app —
                <br />
                into a product that
                <br />
                <span style={{ color: 'var(--accent)' }}>makes money.</span>
              </h1>
              <p
                style={{
                  fontSize: 'clamp(16px,2.1vw,19px)',
                  lineHeight: 1.5,
                  color: 'rgba(255,255,255,.72)',
                  margin: '22px 0 0',
                  maxWidth: 500,
                }}
              >
                Just an idea — or an AI-built app that looks done but breaks with real customers? We
                design, fix, secure, and scale it into a revenue-ready product, live in two weeks. You
                focus on customers; we handle every technical part.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 32, flexWrap: 'wrap' }}>
                <a
                  href={CTA_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-accent"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 9,
                    borderRadius: 10,
                    padding: '15px 26px',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Book a free build call
                  <ArrowRight size={18} strokeWidth={2.4} />
                </a>
                <a
                  href="#how"
                  className="btn-outline"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 10,
                    padding: '15px 24px',
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  See how it works
                </a>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 26,
                  fontSize: 13,
                  color: 'rgba(255,255,255,.5)',
                }}
              >
                <Leaf size={15} strokeWidth={1.7} style={{ color: 'var(--accent)' }} />
                Designed, built &amp; hosted in Canada — your data stays secure.
              </div>
            </div>

            {/* Price tile */}
            <div
              style={{
                flex: '0 1 360px',
                minWidth: 280,
                background: 'var(--accent)',
                color: '#000',
                borderRadius: 20,
                padding: '34px 30px',
                transform: 'rotate(-1.5deg)',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  opacity: 0.65,
                }}
              >
                All-in, Starting From
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginTop: 8 }}>
                <span style={{ fontSize: 30, fontWeight: 700, marginTop: 16 }}>$</span>
                <span
                  style={{
                    fontSize: 'clamp(86px,11vw,112px)',
                    fontWeight: 700,
                    letterSpacing: '-.05em',
                    lineHeight: 0.9,
                  }}
                >
                  80
                </span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>
                CAD / month — all it takes to go to market.
              </div>
              <div style={{ height: 1, background: 'rgba(0,0,0,.18)', margin: '20px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {['Built & launched — no build fee', 'Hosted, secured & maintained', '$0 upfront capital'].map(
                  (t) => (
                    <div
                      key={t}
                      style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14.5, fontWeight: 600 }}
                    >
                      <Check size={17} strokeWidth={2.6} />
                      {t}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <PartnerMarquee />
        </div>
      </section>

      {/* ── Plain-English explainer ─────────────────────────────────────── */}
      <section
        style={{
          borderTop: '1px solid rgba(255,255,255,.1)',
          background: 'linear-gradient(180deg, rgba(255,255,255,.015), transparent)',
        }}
      >
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '60px 32px' }}>
          <div style={EYEBROW}>In plain English</div>
          <h2 style={{ ...SECTION_H2, lineHeight: 1.12, fontSize: 'clamp(26px,3.4vw,34px)', margin: '14px 0 36px', maxWidth: 680 }}>
            No tech talk. Here’s the whole thing in three steps.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }}>
            {PLAIN_STEPS.map(({ n, icon: Icon, title, body }) => (
              <div
                key={n}
                style={{
                  padding: '26px 24px',
                  border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{n}</span>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(244,211,94,.12)',
                      border: '1px solid rgba(244,211,94,.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent)',
                    }}
                  >
                    <Icon size={20} strokeWidth={1.7} />
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 18 }}>{title}</div>
                <div style={{ fontSize: 14.5, color: 'rgba(255,255,255,.6)', marginTop: 7, lineHeight: 1.55 }}>
                  {body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Real cost / HAZL Cloud ──────────────────────────────────────── */}
      <section id="how" style={{ scrollMarginTop: 128, borderTop: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '64px 32px' }}>
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 440px', minWidth: 300 }}>
              <div style={EYEBROW}>01 — The real cost</div>
              <h2 style={{ ...SECTION_H2, lineHeight: 1.04, margin: '16px 0 0' }}>
                AI builds it fast.
                <br />
                Keeping it alive is what costs.
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,.64)', margin: '18px 0 0', maxWidth: 480 }}>
                AI can spin up a working app in a weekend. What quietly drains founders is everything
                after: crashes under real traffic, security holes, weekly tool updates, hosting bills
                that climb. That ongoing work — not the first build — is what sinks most apps before
                they make a dollar.
              </p>
              <div
                style={{
                  marginTop: 26,
                  padding: '22px 24px',
                  border: '1px solid rgba(244,211,94,.4)',
                  borderRadius: 14,
                  background: 'rgba(244,211,94,.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 17, fontWeight: 700 }}>
                  <Cloud size={20} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
                  HAZL Cloud — our secret sauce
                </div>
                <p style={{ fontSize: 14.5, lineHeight: 1.55, color: 'rgba(255,255,255,.7)', margin: '10px 0 0' }}>
                  Our managed platform runs hosting, security, backups, updates and scaling for every
                  app we build. Running it all under one roof is how we can build{' '}
                  <strong style={{ color: '#fff' }}>and</strong> keep your app alive for $80 a month —
                  instead of a big upfront bill.
                </p>
                <a
                  href="https://HazlCloud.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hz-accent-link"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    marginTop: 14,
                    fontSize: 13.5,
                    fontWeight: 700,
                  }}
                >
                  Learn more about HAZL Cloud
                  <ArrowRight size={15} strokeWidth={2.4} />
                </a>
              </div>
            </div>
            <div style={{ flex: '1 1 360px', minWidth: 300 }}>
              <div style={{ ...EYEBROW, marginBottom: 4 }}>What we run for you, every day</div>
              {HANDLES.map((h) => (
                <div
                  key={h.n}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '17px 0',
                    borderBottom: '1px solid rgba(255,255,255,.12)',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', width: 24, flexShrink: 0 }}>
                    {h.n}
                  </span>
                  <div style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>{h.t}</div>
                  <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,.5)', textAlign: 'right', maxWidth: 240 }}>
                    {h.d}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2-week sprint timeline ──────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '64px 32px' }}>
          <div style={EYEBROW}>02 — The 2-week sprint</div>
          <h2 style={{ ...SECTION_H2, margin: '16px 0 38px' }}>Idea Monday. Live in 14 days.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 0 }}>
            {TIMELINE.map((step) => (
              <div key={step.phase} style={{ padding: '4px 20px 0', borderLeft: '1px solid rgba(255,255,255,.14)' }}>
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '.04em',
                    color: '#000',
                    background: 'var(--accent)',
                    padding: '4px 9px',
                    borderRadius: 5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step.phase}
                </div>
                <div style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: '-.02em', margin: '14px 0 0' }}>
                  {step.title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,.55)',
                    marginTop: 7,
                    lineHeight: 1.5,
                    paddingBottom: 24,
                  }}
                >
                  {step.body}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 28,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 14.5,
              color: 'rgba(255,255,255,.6)',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--accent)' }}>
              <RefreshCw size={18} strokeWidth={2} />
              Built for rapid iteration —
            </span>
            we keep shipping improvements every week as you learn what customers actually want.
          </div>
        </div>
      </section>

      {/* ── What we can build ───────────────────────────────────────────── */}
      <section
        id="examples"
        style={{
          scrollMarginTop: 128,
          borderTop: '1px solid rgba(255,255,255,.1)',
          background: 'linear-gradient(180deg, rgba(255,255,255,.015), transparent)',
        }}
      >
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '64px 32px' }}>
          <div style={EYEBROW}>03 — What we can build</div>
          <h2 style={{ ...SECTION_H2, margin: '16px 0 8px' }}>If your customers can pay for it, we can build it.</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', margin: '0 0 36px', maxWidth: 560 }}>
            A few of the products founders launch with us. Not sure which fits? That’s the first
            conversation.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
            {EXAMPLES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="example-card"
                style={{ padding: 24, border: '1px solid rgba(255,255,255,.1)', borderRadius: 16 }}
              >
                <div style={{ color: 'var(--accent)' }}>
                  <Icon size={24} strokeWidth={1.6} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, marginTop: 16 }}>{title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,.58)', marginTop: 7, lineHeight: 1.5 }}>
                  {body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ scrollMarginTop: 128, borderTop: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '64px 32px' }}>
          <div style={EYEBROW}>04 — One simple price</div>
          <h2 style={{ ...SECTION_H2, margin: '16px 0 36px' }}>Everything, for $80 a month.</h2>
          <div
            style={{
              display: 'flex',
              gap: 0,
              flexWrap: 'wrap',
              border: '1px solid rgba(244,211,94,.32)',
              borderRadius: 22,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                flex: '1 1 320px',
                padding: '40px 38px',
                background: 'radial-gradient(120% 120% at 0% 0%, rgba(244,211,94,.12), transparent 60%)',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.42)',
                  marginBottom: 10,
                }}
              >
                All-in, Starting From
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <span style={{ fontSize: 34, fontWeight: 700, marginTop: 14 }}>$</span>
                <span style={{ fontSize: 96, fontWeight: 700, letterSpacing: '-.05em', lineHeight: 0.85 }}>80</span>
                <span style={{ fontSize: 18, color: 'rgba(255,255,255,.55)', marginTop: 16 }}>/ mo</span>
              </div>
              <div style={{ fontSize: 16, color: 'rgba(255,255,255,.7)', marginTop: 14, maxWidth: 280 }}>
                CAD, all-in. No build fee, no setup fee, nothing upfront.
              </div>
              <a
                href={CTA_URL}
                target="_blank"
                rel="noreferrer"
                className="btn-accent"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 9,
                  borderRadius: 10,
                  padding: '15px 26px',
                  fontSize: 15,
                  fontWeight: 700,
                  marginTop: 28,
                }}
              >
                Book a free build call
                <ArrowRight size={18} strokeWidth={2.4} />
              </a>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.42)', marginTop: 16 }}>
                Live in 2 weeks · cancel anytime
              </div>
            </div>
            <div style={{ flex: '1 1 380px', padding: 38, borderLeft: '1px solid rgba(255,255,255,.1)' }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '.04em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.45)',
                  marginBottom: 18,
                }}
              >
                Everything included
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
                {INCLUDED.map((item) => (
                  <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }}>
                      <Check size={15} strokeWidth={2.6} />
                    </span>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,.82)', lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <FaqSection />

      {/* ── Closing CTA ─────────────────────────────────────────────────── */}
      <section
        style={{
          borderTop: '1px solid rgba(255,255,255,.1)',
          background: 'linear-gradient(180deg, rgba(244,211,94,.07), transparent)',
        }}
      >
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '60px 32px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 30,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h2 style={{ fontSize: 'clamp(28px,3.6vw,38px)', lineHeight: 1.04, letterSpacing: '-.03em', fontWeight: 700, margin: 0 }}>
                Your idea deserves to make money.
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', margin: '10px 0 0' }}>
                Canadian team · from $80/month · live in 2 weeks · nothing upfront.
              </p>
            </div>
            <a
              href={CTA_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-accent"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
                borderRadius: 10,
                padding: '16px 30px',
                fontSize: 16,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              Book a free build call
              <ArrowRight size={19} strokeWidth={2.4} />
            </a>
          </div>
        </div>
      </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '48px 32px 36px' }}>
          <div style={{ display: 'flex', gap: 40, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 300 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/hazlCloud-logo-bw2.png"
                  alt="HAZL Solutions"
                  width={28}
                  height={28}
                  style={{ width: 28, height: 28 }}
                />
                <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.03em' }}>HAZL</span>
                <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-.03em', color: 'rgba(255,255,255,.42)' }}>
                  SOLUTIONS
                </span>
              </div>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.5)', margin: '14px 0 0', lineHeight: 1.55 }}>
                We build and run revenue-ready apps for founders — so you can focus on customers, not
                servers.
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  marginTop: 14,
                  fontSize: 12.5,
                  color: 'rgba(255,255,255,.5)',
                }}
              >
                <Leaf size={14} strokeWidth={1.7} style={{ color: 'var(--accent)' }} />
                Proudly built &amp; hosted in Canada
              </div>
            </div>
            <div style={{ display: 'flex', gap: 56, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,.4)',
                    marginBottom: 3,
                  }}
                >
                  Explore
                </div>
                <a href="#how" className="hz-link" style={{ fontSize: 14 }}>
                  How it works
                </a>
                <a href="#examples" className="hz-link" style={{ fontSize: 14 }}>
                  What we build
                </a>
                <a href="#pricing" className="hz-link" style={{ fontSize: 14 }}>
                  Pricing
                </a>
                <a href="#faq" className="hz-link" style={{ fontSize: 14 }}>
                  FAQ
                </a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,.4)',
                    marginBottom: 3,
                  }}
                >
                  Get started
                </div>
                <a href={CTA_URL} target="_blank" rel="noreferrer" className="hz-link" style={{ fontSize: 14 }}>
                  Book a free call
                </a>
                <a href="/enterprise" className="hz-link" style={{ fontSize: 14 }}>
                  For enterprises
                </a>
                <a href="/" className="hz-link" style={{ fontSize: 14 }}>
                  Not sure? Start here
                </a>
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: 38,
              paddingTop: 22,
              borderTop: '1px solid rgba(255,255,255,.08)',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              fontSize: 12.5,
              color: 'rgba(255,255,255,.4)',
            }}
          >
            <span>© HAZL Solutions. All prices in CAD.</span>
            <span>Powered by HAZL Cloud</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
