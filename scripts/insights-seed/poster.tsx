/**
 * Insights poster — portrait 630×867 CSS px, rendered to a PNG at 2x (1260×1734).
 *
 * Layout budget (must sum to 867):
 *   title band 300  +  4 × band 132 (528)  +  footer 39  =  867
 *
 * The top ~38% (the 300px title band plus the first 30px of band 1) has to read
 * on its own: the Insights list cards crop this image to 1200×630 around the
 * hotspot at y = 0.2, i.e. roughly the top 330 CSS px.
 *
 * Text never overflows a band: every band has a fixed height, every text node is
 * line-clamped, and `assertPosterFits` throws at build time when a content field
 * is longer than the limits documented in README.md.
 */
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as lucide from 'lucide-react'

/* ------------------------------------------------------------------ types -- */

export interface PosterSection {
  title: string
  text: string
  icon: string
}

export interface PosterContent {
  headline: string
  subhead: string
  tagline: string
  sections: PosterSection[]
}

export interface PosterProps {
  poster: PosterContent
  /** e.g. "2023-Q1" — rendered as the eyebrow above the headline. */
  quarter: string
}

/* ----------------------------------------------------------------- limits -- */

export const POSTER_LIMITS = {
  headline: 32,
  subhead: 40,
  tagline: 70,
  sectionTitle: 30,
  sectionText: 95,
  sectionCount: 4,
} as const

/* ------------------------------------------------------------- dimensions -- */

export const POSTER_WIDTH = 630
export const POSTER_HEIGHT = 867
const TITLE_BAND_HEIGHT = 300
const BAND_HEIGHT = 132
const FOOTER_HEIGHT = 39
/** Top region (CSS px) that must stand alone as a 1200×630 list card. */
export const CARD_CROP_HEIGHT = Math.round((POSTER_WIDTH * 630) / 1200) // 331

/* --------------------------------------------------------------- palettes -- */

interface BandTheme {
  from: string
  to: string
  /** Flat black overlay opacity, to keep white text at a comfortable contrast. */
  scrim: number
  /** Solid colour used for the chevron notch that hangs below the band. */
  notch: string
}

const BAND_THEMES: BandTheme[] = [
  { from: '#F59E0B', to: '#C2410C', scrim: 0.16, notch: '#C2410C' },
  { from: '#3B82F6', to: '#4338CA', scrim: 0.08, notch: '#4338CA' },
  { from: '#10B981', to: '#0D7A72', scrim: 0.12, notch: '#0D7A72' },
  { from: '#8B5CF6', to: '#C026D3', scrim: 0.1, notch: '#C026D3' },
]

const NAVY_DEEP = '#070D1A'
const TITLE_NOTCH = '#0B1324'

const MONTSERRAT = "'Montserrat', 'Helvetica Neue', Arial, sans-serif"
const INTER = "'Inter', 'Helvetica Neue', Arial, sans-serif"

export const FONT_LINK =
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Inter:wght@400;500;600&display=swap'

/* ------------------------------------------------------------ validation -- */

function isLucideIcon(name: string): boolean {
  const mod = lucide as unknown as Record<string, unknown>
  const candidate = mod[name]
  return (
    typeof candidate === 'function' ||
    (typeof candidate === 'object' && candidate !== null && 'render' in (candidate as object))
  )
}

/**
 * Throws if any poster field exceeds the README limits or names an icon that is
 * not a lucide-react export. `label` identifies the offending content file.
 */
export function assertPosterFits(poster: PosterContent, label: string): void {
  const fail = (msg: string): never => {
    throw new Error(`${label}: ${msg}`)
  }
  const len = (s: string) => Array.from(s).length

  if (len(poster.headline) > POSTER_LIMITS.headline) {
    fail(
      `poster.headline is ${len(poster.headline)} chars, max ${POSTER_LIMITS.headline} — "${poster.headline}"`,
    )
  }
  if (len(poster.subhead) > POSTER_LIMITS.subhead) {
    fail(
      `poster.subhead is ${len(poster.subhead)} chars, max ${POSTER_LIMITS.subhead} — "${poster.subhead}"`,
    )
  }
  if (len(poster.tagline) > POSTER_LIMITS.tagline) {
    fail(
      `poster.tagline is ${len(poster.tagline)} chars, max ${POSTER_LIMITS.tagline} — "${poster.tagline}"`,
    )
  }
  if (!Array.isArray(poster.sections) || poster.sections.length !== POSTER_LIMITS.sectionCount) {
    fail(
      `poster.sections must have exactly ${POSTER_LIMITS.sectionCount} entries, got ${
        Array.isArray(poster.sections) ? poster.sections.length : typeof poster.sections
      }`,
    )
  }
  poster.sections.forEach((section, i) => {
    const at = `poster.sections[${i}]`
    if (typeof section.title !== 'string' || typeof section.text !== 'string') {
      fail(`${at} needs string title and text`)
    }
    if (len(section.title) > POSTER_LIMITS.sectionTitle) {
      fail(
        `${at}.title is ${len(section.title)} chars, max ${POSTER_LIMITS.sectionTitle} — "${section.title}"`,
      )
    }
    if (len(section.text) > POSTER_LIMITS.sectionText) {
      fail(
        `${at}.text is ${len(section.text)} chars, max ${POSTER_LIMITS.sectionText} — "${section.text}"`,
      )
    }
    if (typeof section.icon !== 'string' || !isLucideIcon(section.icon)) {
      fail(`${at}.icon "${section.icon}" is not a lucide-react export`)
    }
  })
}

/* --------------------------------------------------------------- partials -- */

const clamp = (lines: number): React.CSSProperties => ({
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: lines,
  overflow: 'hidden',
})

function LucideIcon({ name, size }: { name: string; size: number }) {
  const mod = lucide as unknown as Record<string, React.ComponentType<Record<string, unknown>>>
  const Component = mod[name]
  if (!Component) throw new Error(`Icon "${name}" is not a lucide-react export`)
  return (
    <Component
      width={size}
      height={size}
      color="#ffffff"
      strokeWidth={1.45}
      style={{ display: 'block', opacity: 0.96 }}
      aria-hidden="true"
    />
  )
}

/**
 * Downward chevron notch hanging from a band boundary. Rendered at the poster
 * root (not inside a band) because the bands clip their own overflow.
 */
function Notch({ color, top }: { color: string; top: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top,
        marginLeft: -16,
        width: 0,
        height: 0,
        borderLeft: '16px solid transparent',
        borderRight: '16px solid transparent',
        borderTop: `14px solid ${color}`,
        zIndex: 5,
      }}
    />
  )
}

function TitleBand({ poster, quarter }: PosterProps) {
  return (
    <div
      style={{
        position: 'relative',
        height: TITLE_BAND_HEIGHT,
        boxSizing: 'border-box',
        padding: '30px 42px 26px',
        background: `radial-gradient(120% 150% at 12% -10%, #16254A 0%, rgba(22,37,74,0) 62%), linear-gradient(162deg, #0D1730 0%, ${NAVY_DEEP} 58%, #0A1328 100%)`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontFamily: INTER,
          fontWeight: 600,
          fontSize: 11.5,
          letterSpacing: 2.6,
          textTransform: 'uppercase',
          color: 'rgba(245,158,11,0.92)',
          marginBottom: 12,
          whiteSpace: 'nowrap',
        }}
      >
        HAZL Insights · {quarter.replace('-', ' ')}
      </div>

      <div
        style={{
          fontFamily: MONTSERRAT,
          fontWeight: 800,
          fontSize: 46,
          lineHeight: '53px',
          letterSpacing: -1.1,
          color: '#ffffff',
          ...clamp(2),
        }}
      >
        {poster.headline}
      </div>

      <div
        style={{
          fontFamily: MONTSERRAT,
          fontWeight: 700,
          fontSize: 23,
          lineHeight: '30px',
          letterSpacing: -0.3,
          color: 'rgba(255,255,255,0.88)',
          marginTop: 7,
          ...clamp(2),
        }}
      >
        {poster.subhead}
      </div>

      <div
        style={{
          width: 72,
          height: 3,
          borderRadius: 2,
          margin: '19px 0 15px',
          background: 'linear-gradient(90deg, #F59E0B 0%, #C026D3 100%)',
        }}
      />

      <div
        style={{
          fontFamily: INTER,
          fontWeight: 400,
          fontSize: 14.5,
          lineHeight: '21px',
          color: 'rgba(255,255,255,0.72)',
          ...clamp(2),
        }}
      >
        {poster.tagline}
      </div>

    </div>
  )
}

function SectionBand({
  section,
  theme,
  iconRight,
}: {
  section: PosterSection
  theme: BandTheme
  iconRight: boolean
}) {
  const text = (
    <div style={{ flex: '1 1 auto', minWidth: 0 }}>
      <div
        style={{
          fontFamily: MONTSERRAT,
          fontWeight: 800,
          fontSize: 20.5,
          lineHeight: '25px',
          letterSpacing: -0.35,
          color: '#ffffff',
          textShadow: '0 1px 2px rgba(0,0,0,0.22)',
          ...clamp(2),
        }}
      >
        {section.title}
      </div>
      <div
        style={{
          fontFamily: INTER,
          fontWeight: 400,
          fontSize: 14.5,
          lineHeight: '19.5px',
          color: 'rgba(255,255,255,0.94)',
          marginTop: 7,
          textShadow: '0 1px 2px rgba(0,0,0,0.18)',
          ...clamp(3),
        }}
      >
        {section.text}
      </div>
    </div>
  )

  const icon = (
    <div
      style={{
        flex: '0 0 92px',
        width: 92,
        height: 92,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <LucideIcon name={section.icon} size={92} />
    </div>
  )

  return (
    <div
      style={{
        position: 'relative',
        height: BAND_HEIGHT,
        boxSizing: 'border-box',
        padding: '0 38px',
        background: `linear-gradient(0deg, rgba(0,0,0,${theme.scrim}), rgba(0,0,0,${theme.scrim})), linear-gradient(118deg, ${theme.from} 0%, ${theme.to} 100%)`,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 26,
        overflow: 'hidden',
      }}
    >
      {iconRight ? (
        <>
          {text}
          {icon}
        </>
      ) : (
        <>
          {icon}
          {text}
        </>
      )}
    </div>
  )
}

function Footer() {
  return (
    <div
      style={{
        height: FOOTER_HEIGHT,
        boxSizing: 'border-box',
        background: NAVY_DEEP,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          height: 3,
          flex: '0 0 3px',
          background:
            'linear-gradient(90deg, #F59E0B 0%, #3B82F6 34%, #10B981 67%, #C026D3 100%)',
        }}
      />
      <div
        style={{
          flex: '1 1 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: INTER,
          fontWeight: 500,
          fontSize: 12,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.74)',
        }}
      >
        HAZL Solutions · hazlsolutions.com/insights
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- the poster -- */

export function Poster({ poster, quarter }: PosterProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        overflow: 'hidden',
        background: NAVY_DEEP,
        display: 'flex',
        flexDirection: 'column',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <TitleBand poster={poster} quarter={quarter} />
      {poster.sections.map((section, i) => (
        <SectionBand key={i} section={section} theme={BAND_THEMES[i]} iconRight={i % 2 === 0} />
      ))}
      <Footer />
      <Notch color={TITLE_NOTCH} top={TITLE_BAND_HEIGHT} />
      {poster.sections.slice(0, -1).map((_, i) => (
        <Notch
          key={`notch-${i}`}
          color={BAND_THEMES[i].notch}
          top={TITLE_BAND_HEIGHT + BAND_HEIGHT * (i + 1)}
        />
      ))}
    </div>
  )
}

/**
 * Validates the poster content, then renders a complete HTML document ready for
 * headless Chrome. Throws (loudly) on any limit violation or unknown icon.
 */
export function renderPosterHtml(props: PosterProps, label: string): string {
  assertPosterFits(props.poster, label)
  const body = renderToStaticMarkup(<Poster {...props} />)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(props.poster.headline)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONT_LINK}">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: ${NAVY_DEEP}; }
  body { width: ${POSTER_WIDTH}px; height: ${POSTER_HEIGHT}px; overflow: hidden; }
  svg { shape-rendering: geometricPrecision; }
</style>
</head>
<body>${body}</body>
</html>
`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
