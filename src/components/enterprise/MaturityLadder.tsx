const LEVELS = [
  {
    title: 'Laptop apps',
    body: 'Built and hosted on personal machines; no backups, no owner.',
  },
  {
    title: 'Shared server',
    body: "One VM or VDI everyone deploys to; works until it doesn't.",
  },
  {
    title: 'Sandboxed',
    body: 'Isolated sandbox per project, controlled database access, alerts on risky queries.',
  },
  {
    title: 'Governed platform',
    body: 'SSO, CI/CD, app gallery, version control, per-team budgets.',
  },
  {
    title: 'Managed & optimised',
    body: 'Monitored, patched, cost-tuned and supported day to day.',
  },
]

export function MaturityLadder() {
  return (
    <section style={{ borderTop: '1px solid rgba(255,255,255,.1)', padding: '72px 5vw' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.4)',
            marginBottom: 14,
          }}
        >
          Where are you today?
        </div>
        <h2
          style={{
            fontSize: 'clamp(26px,3.4vw,40px)',
            lineHeight: 1.06,
            letterSpacing: '-.035em',
            fontWeight: 500,
            margin: 0,
            color: '#fff',
          }}
        >
          From laptop apps to a governed platform.
        </h2>

        {/* Horizontal step row on desktop; the min(200px, 100%) floor collapses
            it to stacked rows on phones without overflowing. */}
        <ol
          role="list"
          aria-label="Maturity levels"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
            gap: 14,
            margin: '40px 0 0',
            padding: 0,
            listStyle: 'none',
          }}
        >
          {LEVELS.map((l, i) => (
            <li
              key={l.title}
              style={{
                borderTop: '2px solid rgba(255,255,255,.14)',
                paddingTop: 16,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '.12em',
                  color: 'var(--accent)',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3
                style={{
                  fontSize: 16.5,
                  fontWeight: 600,
                  letterSpacing: '-.02em',
                  color: '#fff',
                  margin: '10px 0 0',
                }}
              >
                {l.title}
              </h3>
              <p
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  color: 'rgba(255,255,255,.55)',
                  margin: '7px 0 0',
                }}
              >
                {l.body}
              </p>
            </li>
          ))}
        </ol>

        <p
          style={{
            fontSize: 'clamp(16px,2vw,19px)',
            color: '#fff',
            letterSpacing: '-.02em',
            margin: '34px 0 0',
          }}
        >
          We meet you at your level and take you to the next one.
        </p>
      </div>
    </section>
  )
}
