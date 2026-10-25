import {
  GitBranch,
  Server,
  Boxes,
  Activity,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

type Service = { icon: LucideIcon; title: string; body: string }

const SERVICES: Service[] = [
  {
    icon: GitBranch,
    title: 'CI/CD & release engineering',
    body: 'Pipelines, environments, approvals and rollbacks so changes ship safely.',
  },
  {
    icon: Server,
    title: 'Infrastructure as code & cloud',
    body: 'Azure, AWS and on-prem/VDI, reproducible with Terraform/Bicep; landing zones and networking.',
  },
  {
    icon: Boxes,
    title: 'Platform engineering & AI sandboxes',
    body: 'Sandbox-per-project environments, golden paths and an internal app gallery so citizen developers build safely.',
  },
  {
    icon: Activity,
    title: 'Observability & SRE',
    body: 'Monitoring, logging, alerting, backups, incident response and uptime you can measure.',
  },
  {
    icon: ShieldCheck,
    title: 'DevSecOps & governance',
    body: 'SSO, secrets management, policy guardrails, data-access controls and audit trails that satisfy IT and security.',
  },
  {
    icon: Wallet,
    title: 'FinOps & AI cost control',
    body: 'Per-team token and cloud budgets, usage telemetry and alerts, so you can see ROI per app.',
  },
]

export function EnterpriseServices() {
  return (
    <section
      id="services"
      style={{
        background: 'radial-gradient(120% 140% at 50% 0%, #232323 0%, #111 45%, #000 100%)',
        padding: '72px 5vw',
        scrollMarginTop: 80,
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
            marginBottom: 14,
          }}
        >
          What we do
        </div>
        <h2
          style={{
            fontSize: 'clamp(26px,3.4vw,40px)',
            lineHeight: 1.06,
            letterSpacing: '-.035em',
            fontWeight: 500,
            margin: 0,
            maxWidth: 700,
            color: '#fff',
          }}
        >
          DevOps consulting and implementation, end to end.
        </h2>

        <div
          style={{
            display: 'grid',
            // `min(..., 100%)` keeps the track from exceeding the container at
            // 375px, which a bare minmax() floor would do (horizontal scroll).
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))',
            gap: 14,
            marginTop: 40,
          }}
        >
          {SERVICES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="liquid-glass"
              style={{ borderRadius: 16, padding: '24px 24px 26px' }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,.05)',
                  border: '1px solid rgba(255,255,255,.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <Icon size={19} strokeWidth={1.6} />
              </div>
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  letterSpacing: '-.02em',
                  color: '#fff',
                  margin: '18px 0 0',
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: 'rgba(255,255,255,.58)',
                  margin: '8px 0 0',
                }}
              >
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
