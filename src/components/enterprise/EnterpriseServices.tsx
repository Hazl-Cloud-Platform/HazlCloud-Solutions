import { ServicesStrip } from '@/components/ServicesStrip'

export function EnterpriseServices() {
  return (
    <section
      style={{
        background: 'radial-gradient(120% 140% at 50% 0%, #232323 0%, #111 45%, #000 100%)',
        padding: '28px 5vw 72px',
      }}
    >
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.4)',
            marginBottom: 4,
          }}
        >
          What we do
        </div>
        <ServicesStrip />
      </div>
    </section>
  )
}
