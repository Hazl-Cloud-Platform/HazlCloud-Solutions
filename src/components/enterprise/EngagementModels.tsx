import { Users, UserPlus, Headphones, type LucideIcon } from 'lucide-react'

type Model = {
  icon: LucideIcon
  title: string
  pitch: string
  rows: { label: string; value: string }[]
}

const MODELS: Model[] = [
  {
    icon: Users,
    title: 'Forward-deployed engineers',
    pitch:
      'Our engineers sit with your business unit and build alongside the people closest to the problem.',
    rows: [
      { label: 'Who directs', value: 'HAZL lead, with your product owner' },
      { label: 'Where', value: 'On-site / in your tools' },
      {
        label: 'Best when',
        value:
          'A business unit is shipping fast and needs engineering + ops judgment in the room.',
      },
    ],
  },
  {
    icon: UserPlus,
    title: 'Secondment',
    pitch:
      'Our developers and DevOps engineers join your team, under your direction, inside your processes.',
    rows: [
      { label: 'Who directs', value: 'Your managers' },
      { label: 'Where', value: 'Your team, your stack, your ceremonies' },
      { label: 'Best when', value: 'You have the roadmap and need capacity and skills now.' },
    ],
  },
  {
    icon: Headphones,
    title: 'Managed services',
    pitch:
      'We run it: monitoring, patching, backups, on-call, cost reporting — so your teams keep building.',
    rows: [
      { label: 'Who directs', value: 'HAZL, against agreed service levels' },
      { label: 'Where', value: 'Your cloud, your VDI, or HAZL Cloud' },
      { label: 'Best when', value: "The apps are live and nobody's job is to keep them alive." },
    ],
  },
]

export function EngagementModels() {
  return (
    <section
      id="engagement"
      style={{
        borderTop: '1px solid rgba(255,255,255,.1)',
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
          How we engage
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
          Three ways to work with us.
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
            gap: 14,
            marginTop: 40,
          }}
        >
          {MODELS.map(({ icon: Icon, title, pitch, rows }) => (
            <div
              key={title}
              className="liquid-glass"
              style={{
                borderRadius: 16,
                padding: '26px 24px 10px',
                display: 'flex',
                flexDirection: 'column',
              }}
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
                  fontSize: 18,
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
                  color: 'rgba(255,255,255,.62)',
                  margin: '9px 0 0',
                }}
              >
                {pitch}
              </p>

              <dl style={{ margin: '20px 0 0' }}>
                {rows.map((r) => (
                  <div
                    key={r.label}
                    style={{
                      borderTop: '1px solid rgba(255,255,255,.08)',
                      padding: '12px 0',
                    }}
                  >
                    <dt
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: '.14em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,.55)',
                      }}
                    >
                      {r.label}
                    </dt>
                    <dd
                      style={{
                        fontSize: 13.5,
                        lineHeight: 1.5,
                        color: 'rgba(255,255,255,.8)',
                        margin: '5px 0 0',
                      }}
                    >
                      {r.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <p
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,.5)',
            margin: '26px 0 0',
            maxWidth: 740,
          }}
        >
          We usually recommend starting with an assessment, then mixing models — e.g. FDEs to stand
          up the platform, managed services to run it.
        </p>
      </div>
    </section>
  )
}
