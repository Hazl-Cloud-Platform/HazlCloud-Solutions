import { EnterpriseMarquee } from './EnterpriseMarquee'

/** Section chrome around the enterprise-only partner logo marquee. */
export function EnterprisePartners() {
  return (
    <section style={{ borderTop: '1px solid rgba(255,255,255,.1)', padding: '56px 5vw' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <EnterpriseMarquee />
      </div>
    </section>
  )
}
