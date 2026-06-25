# HAZL Solutions — design system conventions

A **dark-first** brand: pure-black surfaces, white/gray type in **Inter**, frosted
"liquid glass" pills and cards, hairline borders, and a soft blur-fade-up entrance.
Components are real, self-contained React (`window.HAZL.*`) — no theme provider.

## Setup (do this once per screen)
- **Render on black.** The stylesheet sets `html, body { background: #000; color: #fff }`.
  Every component is designed for a dark surface — put content on `var(--bg-1)` (`#000`)
  or `var(--bg-2)` (`#050505`); never on white.
- **Font is Inter**, exposed as `var(--font-inter)`; the bundle loads it. Use it for all text.
- **Logo asset:** `LogoMark`, `Navbar`, and `Hero` render `<img src="/brand/hazlCloud-logo-bw2.png">`.
  Serve that file at the site root (it ships in the bundle under `brand/`).

## Styling idiom — Tailwind utilities + signature classes + `var(--token)`
Style with **Tailwind utility classes** (`bg-black`, `text-white`, `text-white/60`,
`rounded-full`, `flex`, `items-center`, `gap-3`, `px-6 py-3`, responsive `md:`/`lg:`),
plus this DS's own vocabulary. Don't invent new color/spacing systems — reach for tokens.

**Signature CSS classes** (defined in the stylesheet, use as-is):
| class | what it does |
|---|---|
| `liquid-glass` | frosted translucent surface with a gradient border edge — the brand's glass pills/cards |
| `animate-blur-fade-up` | the standard entrance: blur + translate-up + fade-in |
| `hazl-hero-text` | legibility text-shadow for type over imagery/video |
| `hazl-blur-veil-abs` | bottom-up blur veil over a hero video |
| `reveal` / `reveal.visible` | scroll-in reveal (add `.visible` when in view) |

**Design tokens** (`var(--…)`, defined in `:root`):
- Surfaces / text: `--bg-1` `#000`, `--bg-2` `#050505`, `--bg-3`; `--fg-1` white, `--fg-2` `#9ca3af`, `--fg-3` `#6b6b6b`, `--fg-inverse` `#000`.
- Palette: `--hazl-black` … `--hazl-ink` `#0a0a0a`, `--hazl-charcoal` `#1a1a1a`, `--hazl-steel` `#404040`, `--hazl-pewter` `#6b6b6b`, `--hazl-fog` `#9ca3af`, `--hazl-mist` `#d1d5db`, `--hazl-bone` `#f3f4f6`, `--hazl-white`.
- Borders: `--border-hairline` / `--border-soft` / `--border-strong` (white at 8/12/20%), `--divider-on-dark`.
- Glass: `--glass-fill`, `--glass-fill-hover`, `--glass-fill-press`, `--glass-blur`, `--glass-border-grad`.
- Radii: `--radius-sm/md/lg/xl` (6/10/14/20px), `--radius-pill` (9999px). Shadows: `--shadow-md/lg`, `--shadow-glass-inner`.
- Signals: `--signal-online` `#22c55e`, `--signal-warn` `#f59e0b`, `--signal-error` `#ef4444`, `--signal-info` `#60a5fa`.
- Motion: `--ease-out`, `--ease-in-out`, `--dur-entrance` (1000ms), `--dur-fast` (200ms).

Accents: white pills for primary actions, the `liquid-glass` treatment for secondary/status
chips, and an amber accent (`#f4d35e`) used sparingly for "approach"/link cues.

## Where the truth lives
Read the bound `styles.css` (and its `_ds_bundle.css` + token imports) for the full token
and class list before styling. Each component's `.d.ts` is its prop contract and its
`.prompt.md` shows intended usage. Icons are **lucide-react** (passed via the `icon` prop).

## Idiomatic example
```jsx
// Dark section with a glass status chip and a primary CTA.
import { ArrowRight, ShieldCheck } from 'lucide-react'

<section style={{ background: 'var(--bg-1)', color: 'var(--fg-1)' }} className="px-8 py-16">
  <window.HAZL.GlassPillWithIcon icon={ShieldCheck}>Production-hardened</window.HAZL.GlassPillWithIcon>
  <h2 className="mt-6 text-4xl font-medium tracking-tight">Ship it like it's running in prod.</h2>
  <p className="mt-3 text-white/60 max-w-[48ch]">From AI prototype to reliable, scalable product.</p>
  <div className="mt-8">
    <window.HAZL.PrimaryButton icon={ArrowRight} iconRight>Book a discovery call</window.HAZL.PrimaryButton>
  </div>
</section>
```
