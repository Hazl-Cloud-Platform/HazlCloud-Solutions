# Enterprise repositioning: technical partner → DevOps consulting & implementation

**Why:** Enterprises increasingly have business-unit staff shipping AI-generated ("vibe-coded")
internal apps. IT has to host, secure, govern and operate the sprawl. HAZL's enterprise site
stops selling "your technical partner / CTO" and sells DevOps consulting and implementation
delivered by a ~60-person bench of developers and DevOps engineers, through three engagement
models: Forward-Deployed Engineers (FDE), secondment, and managed services.

**Research basis (Oct 2026):** mid-size DevOps consultancies (Container Solutions, Caylent,
Mission Cloud, Opsfleet, Arctiq, Eficode, Superorbital, Automat-it, Steamhaus, Nebulaworks).
Common pattern: outcome hero with 2 CTAs → trust/stats → problem → 4–7 service pillars →
engagement model → maturity model / method → closing CTA, often an FAQ. None put FDE,
secondment and managed side by side, and none own "governing vibe-coded internal apps" —
that is HAZL's wedge.

## Scope
- In: `/enterprise`, `/approach`, enterprise card on the `/` chooser, root metadata + JSON-LD,
  `public/llms.txt`, enterprise and approach OG images.
- Out: `/startup`, `/startup/studio`, vibe admin, insights. Startup copy is unchanged.

## Keep (existing artwork / visual system)
Hero background video + blur veil, LogoMark, liquid-glass pills, `pill-cta`, the black/grey
type scale, the HAZL Cloud card on /approach, the approach page's gap grid, steps, caps,
flow diagram, and the partner logo marquee (reused on /enterprise). No new colours or fonts;
accent stays `var(--accent)` (#f4d35e).

## Honesty rules for copy
Only claim: ~60 developers and DevOps engineers; FDE / secondment / managed services;
Calgary, Canada based; Canadian hosting option (HAZL Cloud); existing partner/program logos
with the same "trusted alongside" framing the startup page already uses. Do NOT invent client
names, case-study metrics, certifications, SLA numbers, response times, prices or start dates.

## /enterprise page — section order and copy

1. **Audience bar** — label `Enterprise DevOps` (was "Scale-up / enterprise").
2. **Hero** (video kept)
   - H1: `Your gateway from\nlaptop to production.` (ties to the gate in the hero video; was `DevOps for the apps your teams are building.`)
   - Sub: `60 developers and DevOps engineers who embed with your team, second into your org,
     or run it for you — taking AI-built and legacy apps from laptop to governed production.`
   - CTA primary: `Book a DevOps assessment` → Calendly. Secondary glass pill: `Engagement models` → `#engagement`.
3. **Stats strip** (new, liquid-glass row): `60` engineers · Dev + Ops under one roof ·
   `3` ways to engage (FDE · Secondment · Managed) · Calgary, Canada — Canadian hosting available.
4. **Problem** (ProblemSection rewritten). Eyebrow `The problem`. H2: `Your teams can build an app in an afternoon.` / muted `Someone still has to run it.`
   - App sprawl nobody owns — dozens of one-off AI-built apps and dashboards; no inventory, no owner, no version control.
   - AI agents with keys to production — coding agents pointed at real databases without a sandbox, guardrails or alerts.
   - Hosted on someone's laptop — the app everyone relies on goes down when its builder goes on vacation.
   - Spend nobody can see — token and cloud costs spread across teams with no budgets, telemetry or ROI.
   - Closing line: `We give IT a safe, governed way to say yes — without slowing the business down.` CTA `See how we work` → /approach.
5. **Services** (EnterpriseServices rewritten; 6 cards, lucide icons, 3-col desktop / 1-col mobile). Eyebrow `What we do`, H2 `DevOps consulting and implementation, end to end.`
   - CI/CD & release engineering — pipelines, environments, approvals and rollbacks so changes ship safely.
   - Infrastructure as code & cloud — Azure, AWS and on-prem/VDI, reproducible with Terraform/Bicep; landing zones and networking.
   - Platform engineering & AI sandboxes — sandbox-per-project environments, golden paths and an internal app gallery so citizen developers build safely.
   - Observability & SRE — monitoring, logging, alerting, backups, incident response and uptime you can measure.
   - DevSecOps & governance — SSO, secrets management, policy guardrails, data-access controls and audit trails that satisfy IT and security.
   - FinOps & AI cost control — per-team token and cloud budgets, usage telemetry and alerts, so you can see ROI per app.
6. **Engagement models** (new, `id="engagement"`). Eyebrow `How we engage`, H2 `Three ways to work with us.` Three cards side by side, each with a one-line pitch, then rows:
   - **Forward-deployed engineers** — "Our engineers sit with your business unit and build alongside the people closest to the problem."
     Who directs: HAZL lead, with your product owner · Where: on-site / in your tools · Best when: a business unit is shipping fast and needs engineering + ops judgment in the room.
   - **Secondment** — "Our developers and DevOps engineers join your team, under your direction, inside your processes."
     Who directs: your managers · Where: your team, your stack, your ceremonies · Best when: you have the roadmap and need capacity and skills now.
   - **Managed services** — "We run it: monitoring, patching, backups, on-call, cost reporting — so your teams keep building."
     Who directs: HAZL, against agreed service levels · Where: your cloud, your VDI, or HAZL Cloud · Best when: the apps are live and nobody's job is to keep them alive.
   - Footnote: `Most clients start with an assessment, then mix models — e.g. FDEs to stand up the platform, managed services to run it.`
7. **Maturity ladder** (new). Eyebrow `Where are you today?`, H2 `From laptop apps to a governed platform.` Five levels as a horizontal step row (stack on mobile), each with title + one line:
   1. Laptop apps — built and hosted on personal machines; no backups, no owner.
   2. Shared server — one VM or VDI everyone deploys to; works until it doesn't.
   3. Sandboxed — isolated sandbox per project, controlled database access, alerts on risky queries.
   4. Governed platform — SSO, CI/CD, app gallery, version control, per-team budgets.
   5. Managed & optimised — monitored, patched, cost-tuned and supported day to day.
   - Line under: `We meet you at your level and take you to the next one.`
8. **Partner marquee** — reuse `PartnerMarquee` with eyebrow `Trusted alongside` (same framing as startup).
9. **CTA** (EnterpriseCta): H2 `Bring us the app sprawl. We'll bring the DevOps team.`, sub `Start with a DevOps assessment: we map what your teams have built, what is risky, and what it takes to run it properly.` Button `Book a DevOps assessment`.
10. **Footer**: tagline `© HAZL Solutions · DevOps consulting & implementation.` Keep the startup cross-link.

**Nav:** Navbar desktop (lg+) gets text links `Services` (#services), `Engagement` (#engagement), `Approach` (/approach) before the existing Insights icon button. MobileMenu: Services, Engagement models, Approach, Insights, Contact. Links to `#…` must point to `/enterprise#…` so they work from any page using the Navbar.

**Metadata (/enterprise):** title `HAZL Solutions — DevOps consulting & implementation`; description about 60 engineers, FDE/secondment/managed, governing AI-built apps. OG image: eyebrow `Enterprise DevOps`, title `DevOps for the apps your teams are building.`

## Chooser `/` enterprise card
Title `Enterprise & IT teams`. Body: `Your teams are shipping AI-built apps faster than IT can run them. Our 60 DevOps and software engineers embed, second, or run it for you.` Footer label `FDE · Secondment · Managed`, link text `Explore DevOps services`. Page metadata/description: replace "scales production apps for growing teams" with DevOps consulting wording.

## /approach page
- H1: `Your teams build.` / muted `We make it run.`
- About: H2 `DevOps engineers with an operator's mindset.`; lead: 60-person bench, cloud/CI-CD/observability/security/governance. Keep the HAZL Cloud card verbatim.
- Gap section: keep `Dev is solved. Ops is where products fail.`; Dev column `AI builds the app` (Built in an afternoon / Works in the demo / Shared with the team / Runs on a laptop); Ops column `…then the whole department depends on it` (No owner when it breaks / Agents with production database access / No backups or version control / Token and cloud spend nobody tracks / IT finds out last).
- Steps (keep 3-col layout): 01 Assess — Inventory every app, pipeline and data connection / Map risk, cost and ownership / Plain-language roadmap. 02 Implement — Sandboxes, CI/CD and IaC / SSO, guardrails and alerts / Budgets and usage telemetry. 03 Operate — Monitoring, on-call and backups / Patching and cost tuning / Hand-over or managed services.
- H2 under "How we work" currently has `textWrap: 'nowrap'` — copy: `We focus on the part\nmost teams ignore: Operations.` (keep).
- Caps (5): CI/CD, Infrastructure as code, Observability, Security & governance, FinOps & AI cost — reuse existing icon helpers.
- Team: H2 `60 engineers. Dev and Ops under one roof.`; roles: DevOps & Platform Engineers, Software Developers, Site Reliability Engineers, Cloud Architects.
- Partnership section → eyebrow `How we engage`, H2 `Embedded, seconded, or managed.`; list: Forward-deployed engineers inside your business unit / Secondment into your team, under your direction / Managed services that keep it running / Mix and change models as you grow.
- Flow: Day 1 `AI-built app` → Day 30 `App sprawl` → HAZL node `HAZL embeds, implements and operates` → Day 90+ `Governed & running`. Caption `No rewrite. No shutdown. Same apps, a real platform underneath.`
- End CTA: H2 `Let's make your teams' apps safe to depend on.`; p `Tell us what your teams have built. We'll tell you what's risky, what it costs, and how to run it properly.`; button `Book a DevOps assessment`; keep startup cross-link.
- Footer: `DevOps consulting & implementation`.
- approach/layout.tsx metadata + HowTo JSON-LD updated to match the three steps.

## Root layout / llms.txt
- Root description + org JSON-LD: mention DevOps consulting & implementation for enterprises (FDE, secondment, managed) alongside the startup offer.
- Keywords: remove `fractional CTO`, `technical partner`, `AI MVP scaling`; add `DevOps consulting`, `DevOps implementation`, `forward deployed engineers`, `IT staff secondment`, `managed DevOps services`, `platform engineering`, `AI app governance`, `citizen developer governance`, `vibe-coded apps`, `CI/CD`, `infrastructure as code`, `FinOps`.
- llms.txt: rewrite enterprise bullets and "Who we serve" line for the DevOps offer.
