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

      <main className="approach-main">

        {/* 1. Opening */}
        <section className="approach-section opening reveal">
          <h1 className="approach-h1">
            Most teams build.
            <br />
            <span className="muted">Few know how to run.</span>
          </h1>
        </section>

        {/* 2. About us */}
        <section className="approach-section reveal">
          <div className="eyebrow">About us</div>
          <div className="about-grid">
            <div className="about-copy">
              <h2 className="approach-h2">We build software with an operator&apos;s mindset.</h2>
              <p className="lead about-lead">
                We help teams deliver software. Our specialty is the operations side of the business: cloud,
                infrastructure, observability, uptime, recovery, and the day-to-day systems work that keeps production
                stable.
              </p>
            </div>

            <div className="about-card">
              <div className="about-card-label">Our proprietary platform</div>
              <h3 className="approach-h3">HazlCloud gives IT and infrastructure teams control of what they run.</h3>
              <p>
                Our proprietary platform helps technical professionals manage infrastructure, reduce operational blind spots, and
                make sure the solutions they support continue to operate as expected.
              </p>
              <div className="about-cta-row">
                <span className="about-cta-prompt">If you are a technical professional:</span>
                <a href="https://hazlcloud.com" target="_blank" rel="noreferrer" className="about-link">
                  Explore HAZL Cloud
                  <ArrowRight size={16} />
                </a>
              </div>
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
            <strong>Ops</strong> (operations) is everything that keeps it alive once real users arrive - uptime, security, backups, performance, recovery when things go wrong.
          </p>

          <div className="gap-grid">
            <div className="gap-col dev">
              <span className="gap-label">Dev (build) - easy now</span>
              <span className="gap-title">AI builds the MVP/prototype</span>
              <ul>
                {[
                  'MVP shipped in days',
                  'Features work in the demo',
                  'Quick launch',
                  "Looks great on the founder's laptop",
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
              <span className="gap-title">…then real users show up</span>
              <ul>
                {[
                  "No monitoring - you'll find out from an angry user",
                  'No backups - one bad query and data is gone',
                  'Security gaps - keys in the open, database exposed',
                  'Slow performance under real load',
                  'Crashes when traffic spikes',
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
            This is where most products fail.
          </div>
        </section>

        {/* 4. Approach steps */}
        <section className="approach-section reveal">
          <div className="eyebrow">How we work</div>
          <h2 className="approach-h2" style={{ maxWidth: 'none', textWrap: 'nowrap' }}>
            We focus on the part
            <br />
            most teams ignore: Operations.
          </h2>

          <div className="steps">
            {[
              {
                num: 'Step 01 - Assess',
                title: "Understand what you've built",
                items: [
                  'Full review of your current system',
                  'Map every risk and weak point',
                  'Plain-language report - no jargon',
                ],
              },
              {
                num: 'Step 02 - Stabilize',
                title: 'Stop the bleeding',
                items: [
                  'Fix the crashes and instability',
                  'Add monitoring, alerts, and backups',
                  'Close the security gaps',
                ],
              },
              {
                num: 'Step 03 - Scale',
                title: 'Ready it for growth',
                items: [
                  'Performance under real load',
                  'Reliable, observable infrastructure',
                  'Headroom for the next 10x',
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
          <h2 className="approach-h2">Five things that keep your product alive.</h2>

          <div className="caps">
            {[
              { title: 'Reliability',      desc: "Your system stays up - and you're the first to know if anything wobbles.", icon: <ReliabilityIcon /> },
              { title: 'Security',         desc: 'Keys locked down, data protected, users safe - not an afterthought.',      icon: <SecurityIcon /> },
              { title: 'Performance',      desc: 'Pages load fast. Actions feel instant. Users actually stick around.',        icon: <PerformanceIcon /> },
              { title: 'Scalability',      desc: 'Handle 10 users or 100,000 - without rewriting from scratch.',              icon: <ScalabilityIcon /> },
              { title: 'Ongoing Support',  desc: 'We stay on the line. As you grow, we keep your foundation solid.',          icon: <SupportIcon /> },
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
          <h2 className="approach-h2">Built by operators, not just developers.</h2>

          <div className="team-wrap">
            <div className="team-roles">
              {[
                { icon: <CodeIcon />,  name: 'Software Developers', desc: 'Ship the features that move the business forward.' },
                { icon: <CloudIcon />, name: 'Cloud Architects',     desc: "Design systems that don't fall over when traffic doubles." },
                { icon: <ChartIcon />, name: 'Business Analysts',    desc: 'Translate technical decisions into business outcomes.' },
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
              <span className="pull-muted">We make sure your product works in the real world.</span>
            </p>
          </div>
        </section>

        {/* 7. Partnership */}
        <section className="approach-section reveal">
          <div className="eyebrow">After launch</div>
          <h2 className="approach-h2">We stay with you.</h2>

          <ul className="partner-list">
            {[
              'Ongoing support and maintenance',
              'Continuous improvements',
              'Technical guidance as you grow',
              'Long-term technical partner - not a vendor',
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
          <div className="eyebrow">From start to scale</div>
          <h2 className="approach-h2">From prototype to production-ready.</h2>

          <div className="flow-wrap">
            <div className="flow-track">
              <div className="flow-node input-node">
                <span className="flow-lbl">Day 1</span>
                <span className="flow-name">AI prototype</span>
              </div>
              <div className="flow-arrow"><ArrowRightSmIcon /></div>
              <div className="flow-node broken-node">
                <span className="flow-lbl">Day 30</span>
                <span className="flow-name">Fragile system</span>
              </div>
              <div className="flow-arrow"><ArrowRightSmIcon /></div>
              <div className="flow-node hazl-node">
                <LogoMark className="flow-logo" />
                <span className="flow-name">HAZL works with you on development & operations</span>
              </div>
              <div className="flow-arrow"><ArrowRightSmIcon /></div>
              <div className="flow-node output-node">
                <span className="flow-lbl">Day 90+</span>
                <span className="flow-name">Stable &amp; scalable</span>
              </div>
            </div>
            <div className="flow-caption">No rewrite. No starting over. Same product, real foundation.</div>
          </div>
        </section>

        {/* End CTA */}
        <div className="end-cta reveal" id="contact">
          <div className="end-cta-headline">Contact us! Ready when you are.</div>
          <h2 className="approach-h2" style={{ maxWidth: 'none', textAlign: 'left', fontSize: 'clamp(28px, 3.6vw, 42px)' }}>
            Let&apos;s make your product survive its first real users.
          </h2>
          <p>
            Send us what you&apos;ve built. We&apos;ll tell you exactly what&apos;s going to break first - and what it takes to fix it.
          </p>
          <a className="pill-cta" href="https://calendly.com/anthony-tam-hazl/30min" target="_blank" rel="noreferrer">
            Turn My MVP Into a Real Product
            <ArrowRight size={16} />
          </a>
        </div>

      </main>

      <footer className="approach-footer">
        <span>© 2026 HAZL Solutions</span>
        <span>Your long-term technical partner</span>
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
function PerformanceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
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
function SupportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
