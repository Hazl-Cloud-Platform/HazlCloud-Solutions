// Shared content for the startup / small-business landing page (/startup).
// Mirrors the data defined in the HAZL Solutions.dc.html design handoff.

export const CTA_URL = 'https://calendly.com/anthony-tam-hazl/30min'

export type Partner = { name: string; src: string }

// Logos live in /public/brand/partners/. Tiles whose image is missing are
// hidden gracefully by <PartnerMarquee>.
export const PARTNERS: Partner[] = [
  { name: 'Microsoft', src: '/brand/partners/microsoft.png' },
  { name: 'Amazon', src: '/brand/partners/amazon.png' },
  { name: 'Google', src: '/brand/partners/google.png' },
  { name: 'Plug and Play', src: '/brand/partners/plug-and-play.png' },
  { name: 'Platform Calgary', src: '/brand/partners/platform-calgary.png' },
  { name: 'Amii', src: '/brand/partners/amii.png' },
  { name: 'Alberta Innovates', src: '/brand/partners/alberta-innovates.png' },
  { name: 'Red Deer Polytechnic', src: '/brand/partners/red-deer-polytechnic.png' },
  { name: 'SAIT', src: '/brand/partners/sait.png' },
  { name: 'NAIT', src: '/brand/partners/nait.webp' },
  { name: 'University of Calgary', src: '/brand/partners/university-of-calgary.png' },
  { name: 'APEGA', src: '/brand/partners/apega.png' },
  { name: 'BMO', src: '/brand/partners/bmo.png' },
  { name: 'Web Summit', src: '/brand/partners/websummit.png' },
]

export type Handle = { n: string; t: string; d: string }

export const HANDLES: Handle[] = [
  { n: '01', t: 'Hosting & uptime', d: 'Your app stays online. We run the servers.' },
  { n: '02', t: 'Security & backups', d: 'Locked down, monitored, backed up daily.' },
  { n: '03', t: 'Updates & fixes', d: 'Tools change weekly. We keep up so you don’t.' },
  { n: '04', t: 'Scaling', d: '10 customers or 10,000 — it keeps working.' },
  { n: '05', t: 'A human on call', d: 'Breaks at 2am? A real person responds.' },
]

export type TimelineStep = { phase: string; title: string; body: string }

export const TIMELINE: TimelineStep[] = [
  {
    phase: 'Day 0',
    title: 'Start with a screen',
    body: 'Bring a sketch or an AI-built mockup — or we make the first one. We turn it into a real plan.',
  },
  {
    phase: 'Days 1–3',
    title: 'We sit down together',
    body: 'A working session to pin down what your app does and who pays for it.',
  },
  {
    phase: 'Days 4–10',
    title: 'We build it for real',
    body: 'Payments, logins, your data, backups — wired up, secured, and tested.',
  },
  {
    phase: 'Days 11–14',
    title: 'You go live',
    body: 'Launches on HAZL Cloud, monitored 24/7, ready for paying customers.',
  },
  {
    phase: 'Then weekly',
    title: 'We keep shipping',
    body: 'Rapid iteration as you learn what your customers actually want.',
  },
]

export const INCLUDED: string[] = [
  'Your app, designed & built — no build fee',
  'Hosting & uptime on HAZL Cloud',
  'Payments, logins & customer accounts',
  'Daily backups & security monitoring',
  'Updates, fixes & ongoing maintenance',
  'Scales as your customers grow',
  'A Canadian team on call',
  'You own your app & your data',
]

export type Faq = { q: string; a: string }

export const FAQS: Faq[] = [
  {
    q: 'I’m not technical at all — can I still do this?',
    a: 'Yes. That’s exactly who we build for. You bring the idea; we handle every technical part and explain everything in plain English. No code, no jargon.',
  },
  {
    q: 'What does $80/month actually cover?',
    a: 'Everything: design, build, hosting, security, daily backups, updates, and a real human keeping it running. No upfront cost and no separate build fee.',
  },
  {
    q: 'What’s the catch with no money upfront?',
    a: 'No catch. HAZL Cloud lets us run and maintain many apps efficiently, so we spread the cost into one low monthly price instead of a big bill at the start.',
  },
  {
    q: 'Do I own my app and my data?',
    a: 'Yes. It’s your product and your data, hosted securely in Canada. If you ever leave, you take it with you.',
  },
  {
    q: 'Can it really be ready in two weeks?',
    a: 'Yes — for a focused first version your customers can actually pay for. We launch that, then keep improving it every week as you learn what works.',
  },
  {
    q: 'I already built something with AI — now what?',
    a: 'Perfect. Bring it. We make it secure, reliable, and ready for real customers instead of one demo user — usually faster than starting fresh.',
  },
  {
    q: 'What happens if I grow quickly?',
    a: 'Great problem to have. HAZL Cloud scales with you automatically, and pricing only grows sensibly as your usage does. No surprise bills.',
  },
]
