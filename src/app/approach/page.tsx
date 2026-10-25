'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Home } from 'lucide-react'
import { LogoMark } from '@/components/LogoMark'

export default function ApproachPage() {
  const [contactInView, setContactInView] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))

    const contactEl = document.getElementById('contact')
    let contactIo: IntersectionObserver | null = null
    if (contactEl) {
      contactIo = new IntersectionObserver(
        ([entry]) => setContactInView(entry.isIntersecting),
        { threshold: 0.35 }
      )
      contactIo.observe(contactEl)
    }

    return () => {
      io.disconnect()
      contactIo?.disconnect()
    }
  }, [])

  const handleContactClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      {/* Nav */}
      <header className="approach-nav">
        <Link href="/" className="approach-logo">
          <LogoMark className="approach-logo-mark" />
          <span className="approach-logo-word">HAZL</span>
          <span className="approach-logo-sub">Solutions</span>
        </Link>
        <nav className="approach-nav-links">
          <Link href="/" className="approach-home" aria-label="Home">
            <Home size={16} strokeWidth={1.5} />
          </Link>
          <Link href="/approach" className={contactInView ? '' : 'active'}>Approach</Link>
          <a href="#contact" onClick={handleContactClick} className={contactInView ? 'active' : ''}>Contact</a>
          <Link href="/insights">News</Link>
        </nav>
      </header>

      <main id="main-content" className="approach-main">

        {/* 1. Opening */}
        <section className="approach-section opening reveal">
          <h1 className="approach-h1">
            Your teams build.
            <br />
            <span className="muted">We make it run.</span>
          </h1>
        </section>

        {/* 2. About us */}
        <section className="approach-section reveal">
          <div className="eyebrow">About us</div>
          <div className="about-grid">
            <div className="about-copy">
              <h2 className="approach-h2">DevOps engineers with an operator&apos;s mindset.</h2>
              <p className="lead about-lead">
                We are a bench of 60 developers and DevOps engineers based in Calgary, Canada. Our specialty is the
                operations side: cloud, CI/CD, infrastructure as code, observability, security and governance - the
                day-to-day systems work that keeps the apps your teams build running in production.
              </p>
            </div>

            <div className="about-card">
              <div className="about-card-label">
                Our proprietary platform
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/hazlCloud-logo-png.png"
                  alt="HazlCloud"
                  className="about-card-label-logo"
                />
              </div>
              <h3 className="approach-h3">HAZL Cloud gives IT and infrastructure teams control of what they run.</h3>
              <p>
                Our <strong>proprietary</strong> platform helps technical professionals manage infrastructure, reduce operational blind spots, and
                make sure the solutions they support continue to operate as expected.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Dev vs Ops gap */}
        <section className="approach-section reveal">
          <div className="eyebrow">The gap nobody talks about</div>
          <h2 className="approach-h2">Dev is solved. Ops is where products fail.</h2>
          <p className="lead">
            <strong>Dev</strong> (development) is building the product - writing the code, shipping features, getting the demo working.
            <br />
            <strong>Ops</strong> (operations) is everything that keeps it alive once the business depends on it - uptime, security, backups, performance, recovery when things go wrong.
          </p>

          <div className="gap-grid">
            <div className="gap-col dev">
              <span className="gap-label">Dev (build) - easy now</span>
              <span className="gap-title">AI builds the app</span>
              <ul>
                {[
                  'Built in an afternoon',
                  'Works in the demo',
                  'Shared with the team',
                  'Runs on a laptop',
                ].map((item) => (
                  <li key={item}>
                    <span className="gap-dot good"><CheckIcon /></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="gap-divider" />
            <div className="gap-col ops">
              <span className="gap-label">Ops (run) - overlooked</span>
              <span className="gap-title">…then the whole department depends on it</span>
              <ul>
                {[
                  'No owner when it breaks',
                  'Agents with production database access',
                  'No backups or version control',
                  'Token and cloud spend nobody tracks',
                  'IT finds out last',
                ].map((item) => (
                  <li key={item}>
                    <span className="gap-dot bad"><XIcon /></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="gap-stamp">
            <span className="pulse" />
            This is where most apps fail.
          </div>
        </section>

        {/* 4. Approach steps */}
        <section className="approach-section reveal">
          <div className="eyebrow">How we work</div>
          <h2 className="approach-h2 approach-h2-nowrap" style={{ maxWidth: 'none' }}>
            We focus on the part
            <br />
            most teams ignore: Operations.
          </h2>

          <div className="steps">
            {[
              {
                num: 'Step 01 - Assess',
                title: "Understand what your teams have built",
                items: [
                  'Inventory every app, pipeline and data connection',
                  'Map risk, cost and ownership',
                  'Plain-language roadmap - no jargon',
                ],
              },
              {
                num: 'Step 02 - Implement',
                title: 'Put a real platform underneath',
                items: [
                  'Sandboxes, CI/CD and infrastructure as code',
                  'SSO, guardrails and alerts',
                  'Budgets and usage telemetry',
                ],
              },
              {
                num: 'Step 03 - Operate',
                title: 'Keep it running day to day',
                items: [
                  'Monitoring, on-call and backups',
                  'Patching and cost tuning',
                  'Hand-over or managed services',
                ],
              },
            ].map((step, i, arr) => (
              <div key={step.num} className="step">
                <div className="step-num">{step.num}</div>
                <h3 className="approach-h3">{step.title}</h3>
                <ul>
                  {step.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {i < arr.length - 1 && (
                  <div className="step-arrow">
                    <ChevronRightIcon />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 5. Capability cards */}
        <section className="approach-section reveal">
          <div className="eyebrow">What we actually do</div>
          <h2 className="approach-h2">Five things that keep your apps alive.</h2>

          <div className="caps">
            {[
              { title: 'CI/CD',                 desc: 'Pipelines, environments, approvals and rollbacks so changes ship safely.',          icon: <PipelineIcon /> },
              { title: 'Infrastructure as code', desc: 'Azure, AWS and on-prem/VDI, reproducible with Terraform and Bicep.',               icon: <ServerIcon /> },
              { title: 'Observability',          desc: 'Monitoring, logging, alerting and backups - so you know before your users do.',    icon: <ReliabilityIcon /> },
              { title: 'Security & governance',  desc: 'SSO, secrets management, policy guardrails, data-access controls and audit trails.', icon: <SecurityIcon /> },
              { title: 'FinOps & AI cost',       desc: 'Per-team token and cloud budgets, usage telemetry and alerts you can act on.',     icon: <ScalabilityIcon /> },
            ].map(({ title, desc, icon }) => (
              <div key={title} className="cap">
                <div className="cap-ic">{icon}</div>
                <h4 className="approach-h4">{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Team */}
        <section className="approach-section reveal">
          <div className="eyebrow">Who you&apos;re working with</div>
          <h2 className="approach-h2">60 engineers. Dev and Ops under one roof.</h2>

          <div className="team-wrap">
            <div className="team-roles">
              {[
                { icon: <ServerIcon size={16} />, name: 'DevOps & Platform Engineers', desc: 'Build the pipelines, sandboxes and golden paths your teams ship through.' },
                { icon: <CodeIcon />,            name: 'Software Developers',          desc: 'Take AI-built and legacy apps from a prototype to maintainable code.' },
                { icon: <ChartIcon />,           name: 'Site Reliability Engineers',   desc: 'Monitoring, alerting, on-call and recovery when something goes wrong.' },
                { icon: <CloudIcon />,           name: 'Cloud Architects',             desc: 'Landing zones, networking and hosting that IT and security can sign off on.' },
              ].map(({ icon, name, desc }) => (
                <div key={name} className="role">
                  <div className="role-left">
                    <div className="role-ic">{icon}</div>
                    <div>
                      <div className="role-name">{name}</div>
                      <div className="role-desc">{desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="pull-quote">
              We do not just build features.{' '}
              <span className="pull-muted">We make sure the apps your teams depend on keep running.</span>
            </p>
          </div>
        </section>

        {/* 7. Partnership */}
        <section className="approach-section reveal">
          <div className="eyebrow">How we engage</div>
          <h2 className="approach-h2">Embedded, seconded, or managed.</h2>

          <ul className="partner-list">
            {[
              'Forward-deployed engineers inside your business unit',
              'Secondment into your team, under your direction',
              'Managed services that keep it running',
              'Mix and change models as you grow',
            ].map((item) => (
              <li key={item}>
                <span className="check-icon"><SmallCheckIcon /></span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* 8. Flow diagram */}
        <section className="approach-section reveal">
          <div className="eyebrow">From sprawl to platform</div>
          <h2 className="approach-h2">From laptop apps to a governed platform.</h2>

          <div className="flow-wrap">
            <div className="flow-track">
              <div className="flow-node input-node">
                <span className="flow-lbl">Day 1</span>
                <span className="flow-name">AI-built app</span>
              </div>
              <div className="flow-arrow"><ArrowRightSmIcon /></div>
              <div className="flow-node broken-node">
                <span className="flow-lbl">Day 30</span>
                <span className="flow-name">App sprawl</span>
              </div>
              <div className="flow-arrow"><ArrowRightSmIcon /></div>
              <div className="flow-node hazl-node">
                <LogoMark className="flow-logo" />
                <span className="flow-name">HAZL embeds, implements and operates</span>
              </div>
              <div className="flow-arrow"><ArrowRightSmIcon /></div>
              <div className="flow-node output-node">
                <span className="flow-lbl">Day 90+</span>
                <span className="flow-name">Governed &amp; running</span>
              </div>
            </div>
            <div className="flow-caption">No rewrite. No shutdown. Same apps, a real platform underneath.</div>
          </div>
        </section>

        {/* End CTA */}
        <div className="end-cta reveal" id="contact">
          <div className="end-cta-headline">Contact us! Ready when you are.</div>
          <h2 className="approach-h2" style={{ maxWidth: 'none', textAlign: 'left', fontSize: 'clamp(28px, 3.6vw, 42px)' }}>
            Let&apos;s make your teams&apos; apps safe to depend on.
          </h2>
          <p>
            Tell us what your teams have built. We&apos;ll tell you what&apos;s risky, what it costs, and how to run it properly.
          </p>
          <a className="pill-cta" href="https://calendly.com/anthony-tam-hazl/30min" target="_blank" rel="noreferrer">
            Book a DevOps assessment
            <ArrowRight size={16} />
          </a>
          <p style={{ marginTop: 16 }}>
            Just starting from an idea?{' '}
            <Link href="/startup" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              See our affordable software development for startups
            </Link>
            .
          </p>
        </div>

      </main>

      <footer className="approach-footer">
        <span>© 2026 HAZL Solutions</span>
        <span>DevOps consulting &amp; implementation</span>
      </footer>
    </>
  )
}

/* ── Icon helpers ─────────────────────────────────────────────────────────── */
function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
function ChevronRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
function ArrowRightSmIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  )
}
function ReliabilityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
function SecurityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}
function PipelineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="5" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="12" r="2" />
      <path d="M6 7v10" /><path d="M8 5h4a4 4 0 0 1 4 4v1" /><path d="M8 19h4a4 4 0 0 0 4-4v-1" />
    </svg>
  )
}
function ServerIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="7" rx="2" /><rect x="3" y="14" width="18" height="7" rx="2" />
      <line x1="7" y1="6.5" x2="7.01" y2="6.5" /><line x1="7" y1="17.5" x2="7.01" y2="17.5" />
    </svg>
  )
}
function ScalabilityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 17 9 11 13 15 21 7" /><polyline points="14 7 21 7 21 14" />
    </svg>
  )
}
function CodeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  )
}
function CloudIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-6" />
    </svg>
  )
}
function SmallCheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
