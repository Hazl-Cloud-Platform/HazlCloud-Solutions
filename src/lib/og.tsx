import { ImageResponse } from 'next/og'

// Shared 1200×630 social-share image, rendered with next/og (Satori).
// Keep styles Satori-safe: every multi-child box sets display:flex, no CSS
// shorthands like `text-transform` (uppercase the strings instead), flat
// colors over gradients for reliability.

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const ACCENT = '#f4d35e'

type Variant = 'price' | 'enterprise'

export function renderOgImage(opts: { eyebrow: string; title: string; variant?: Variant }) {
  const { eyebrow, title, variant = 'price' } = opts
  const showPrice = variant === 'price'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#000',
          color: '#fff',
          padding: 72,
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* ambient accent glow */}
        <div
          style={{
            position: 'absolute',
            top: -170,
            right: -150,
            width: 580,
            height: 580,
            borderRadius: '50%',
            background: 'rgba(244,211,94,0.10)',
          }}
        />

        {/* wordmark */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              width: 48,
              height: 48,
              borderRadius: 13,
              background: 'rgba(244,211,94,0.16)',
              border: `2px solid ${ACCENT}`,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 18,
            }}
          >
            <div style={{ width: 22, height: 16, borderRadius: 5, background: ACCENT }} />
          </div>
          <div style={{ display: 'flex', fontSize: 32, fontWeight: 700, letterSpacing: -1 }}>
            <span>HAZL</span>
            <span style={{ color: 'rgba(255,255,255,0.45)', marginLeft: 12 }}>SOLUTIONS</span>
          </div>
        </div>

        {/* body */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: showPrice ? 600 : 940 }}>
            <div style={{ display: 'flex', fontSize: 23, fontWeight: 700, letterSpacing: 3, color: ACCENT }}>
              {eyebrow.toUpperCase()}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: showPrice ? 60 : 66,
                fontWeight: 800,
                lineHeight: 1.04,
                letterSpacing: -2.5,
                marginTop: 20,
              }}
            >
              {title}
            </div>
          </div>

          {showPrice && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: ACCENT,
                color: '#000',
                borderRadius: 30,
                padding: '38px 42px',
                marginLeft: 44,
                transform: 'rotate(-3deg)',
              }}
            >
              <div style={{ display: 'flex', fontSize: 18, fontWeight: 700, letterSpacing: 2, opacity: 0.7 }}>
                ALL-IN, STARTING FROM
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 6 }}>
                <span style={{ fontSize: 52, fontWeight: 800, marginTop: 20 }}>$</span>
                <span style={{ fontSize: 156, fontWeight: 800, lineHeight: 1, letterSpacing: -7 }}>80</span>
              </div>
              <div style={{ display: 'flex', fontSize: 23, fontWeight: 700, marginTop: 2 }}>CAD / month</div>
              <div style={{ display: 'flex', width: '100%', height: 2, background: 'rgba(0,0,0,0.18)', margin: '18px 0' }} />
              <div style={{ display: 'flex', fontSize: 21, fontWeight: 700 }}>No upfront cost</div>
            </div>
          )}
        </div>

        {/* footer */}
        <div style={{ display: 'flex', fontSize: 23, color: 'rgba(255,255,255,0.62)' }}>
          {showPrice
            ? 'Live in 2 weeks · nothing upfront · built & hosted in Canada'
            : 'Built & hosted in Canada · a Canadian team'}
        </div>
      </div>
    ),
    { ...OG_SIZE }
  )
}
