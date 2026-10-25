/**
 * Liquid-glass stats row under the enterprise hero. Facts only — bench size,
 * the three engagement models, and where we are (see the copy honesty rules in
 * docs/growth/enterprise-devops-repositioning.md). No invented metrics.
 */
const STATS = [
  {
    value: '60',
    label: 'Developers and DevOps engineers',
    sub: 'Dev + Ops under one roof',
  },
  {
    value: '3',
    label: 'Ways to engage',
    sub: 'FDE · Secondment · Managed',
  },
  {
    value: 'Calgary',
    label: 'Canada based',
    sub: 'Canadian hosting available',
  },
]

export function EnterpriseStats() {
  return (
    <section aria-label="At a glance" style={{ background: '#000', padding: '36px 5vw 8px' }}>
      <div
        style={{
          maxWidth: 1160,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
          gap: 14,
        }}
      >
        {STATS.map((s) => (
          <div
            key={s.label}
            className="liquid-glass"
            style={{ borderRadius: 16, padding: '20px 22px' }}
          >
            <div
              style={{
                fontSize: 'clamp(28px,3.4vw,38px)',
                fontWeight: 600,
                letterSpacing: '-.035em',
                lineHeight: 1,
                color: '#fff',
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: 14.5,
                fontWeight: 500,
                color: '#fff',
                marginTop: 12,
                letterSpacing: '-.01em',
              }}
            >
              {s.label}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.52)', marginTop: 5 }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
