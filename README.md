# HAZL Solutions

Marketing site for HAZL Solutions. Built with **Next.js 14** (App Router), **Tailwind CSS**, and **Sanity v3** as the CMS. The Sanity Studio is embedded at `/studio`, and content updates trigger on-demand revalidation through `/api/revalidate`.

---

## Stack

- Next.js 14.2 (App Router, Node runtime)
- React 18, TypeScript 5
- Tailwind CSS 3
- Sanity v3 (`next-sanity`) — embedded Studio at `/studio`
- Lucide icons, styled-components

---

## Prerequisites

- **Node.js 18.17+** (Node 20 LTS recommended)
- **npm** (a `package-lock.json` is committed)
- A **Sanity** project — create one free at <https://sanity.io/manage>. You need its `projectId` and `dataset` name.

---

## Local development

### 1. Install dependencies

```bash
npm install
```

If you hit `EACCES` errors about `/Users/<you>/.npm/_cacache`, fix the npm cache ownership once:

```bash
sudo chown -R "$(id -u):$(id -g)" "$HOME/.npm"
```

### 2. Configure environment variables

Copy the example file and fill in your Sanity values:

```bash
cp .env.example .env.local
```

`.env.local`:

```bash
# Public site URL (used for canonical, OG, sitemap, robots)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Sanity (from https://sanity.io/manage)
NEXT_PUBLIC_SANITY_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-10-01

# Optional: read token for previewing drafts / private datasets
SANITY_API_READ_TOKEN=

# Shared secret for the /api/revalidate webhook
# Generate with: openssl rand -hex 32
SANITY_REVALIDATE_SECRET=
```

If `NEXT_PUBLIC_SANITY_PROJECT_ID` is empty, `isSanityConfigured` is false and CMS-backed routes (e.g. `/insights`) render empty.

### 3. Allow the Studio to talk to Sanity

In <https://sanity.io/manage> → your project → **API → CORS origins**, add:

- `http://localhost:3000` — **Allow credentials: yes**

### 4. Run the dev server

```bash
npm run dev
```

- Site: <http://localhost:3000>
- Studio: <http://localhost:3000/studio> (sign in with your Sanity account)

### 5. (Optional) Test the revalidate webhook locally

`/api/revalidate` validates a Sanity-signed payload. To exercise it from a real Sanity webhook in development, expose port 3000 with a tunnel (e.g. `ngrok http 3000`) and point a Sanity webhook at `https://<tunnel>/api/revalidate` with the same `SANITY_REVALIDATE_SECRET`.

---

## Available scripts

| Script          | Purpose                                   |
| --------------- | ----------------------------------------- |
| `npm run dev`   | Start the Next.js dev server on port 3000 |
| `npm run build` | Production build (`.next/`)               |
| `npm run start` | Serve the production build                |
| `npm run lint`  | Run `next lint`                           |

To run dev on a different port (e.g. when 3000 is taken):

```bash
npm run dev -- -p 3001
```

---

## Production deployment

The `/api/revalidate` route pins `runtime = 'nodejs'`, so deploy to a Node-runtime host. **Vercel** is the smoothest fit; any Node host works.

### Required environment variables (production)

| Variable                          | Required | Notes                                                        |
| --------------------------------- | -------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`            | yes      | Canonical site URL, e.g. `https://hazlsolutions.com`         |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`   | yes      | From sanity.io/manage                                        |
| `NEXT_PUBLIC_SANITY_DATASET`      | yes      | Usually `production`                                         |
| `NEXT_PUBLIC_SANITY_API_VERSION`  | yes      | `2024-10-01`                                                 |
| `SANITY_API_READ_TOKEN`           | optional | Only if previewing drafts or reading a private dataset       |
| `SANITY_REVALIDATE_SECRET`        | yes      | Random string; must match the Sanity webhook's secret        |

Generate the revalidate secret with:

```bash
openssl rand -hex 32
```

### Option A — Vercel (recommended)

1. Push the repo to GitHub.
2. <https://vercel.com/new> → import the repo. Vercel auto-detects Next.js (build = `next build`).
3. **Project → Settings → Environment Variables**: add all variables above for the **Production** environment (and **Preview** if you want preview deployments to work).
4. Deploy.
5. **Settings → Domains**: attach your custom domain (e.g. `hazlsolutions.com`).
6. In <https://sanity.io/manage> → **API → CORS origins**, add `https://<your-domain>` with **Allow credentials: yes** so `/studio` works in production.
7. Wire the Sanity webhook (see below).

### Option B — Self-hosted Node

```bash
npm ci
npm run build
npm run start          # serves on $PORT (default 3000)
```

Set the same env vars in your process manager (systemd, PM2, Docker, etc.) and put it behind a reverse proxy (nginx, Caddy) terminating TLS. Then complete the Sanity CORS + webhook steps with your real domain.

---

## Vibe Studio (`/startup/studio`)

A public, anonymous UI-mockup builder. A visitor describes an app, an LLM returns a single
self-contained HTML document, and it renders in a sandboxed iframe. It is deliberately
**presentational only** — fake data, no working backend — because the product pitch is that
turning a demo into a real product is the work HAZL does. The exit is "Contact our team",
which captures an email and keeps the design.

### It cannot run on Vercel

Generated documents are stored **on the filesystem** (Postgres holds only the pointer), a first
generation takes 60–100 seconds, and the concurrency limiter is per process. All three break on
serverless. The feature is therefore gated behind `VIBE_ENABLED=1` and ships dark until the VM
deployment is live. See `scripts/deploy/bootstrap-vm.sh` and `.github/workflows/deploy.yml`.

### Running it locally

```bash
npm run dev:vibe     # layers both Doppler configs, then next dev
```

which is:

```bash
doppler run -p hazl-general -c prd -- \
  doppler run -p dr-keys -c prd_llm_opus4-8 -- next dev
```

You also need `VIBE_ENABLED=1`, `NEXT_PUBLIC_VIBE_ENABLED=1` and a writable `VIBE_STORAGE_DIR`.
Turnstile verification is skipped outside production, so no Cloudflare account is needed to
develop. Every variable is documented in `.env.example`.

### Commands

| Command | What it does |
|---|---|
| `npm run vibe:migrate` | Applies the schema (seven `Sol-Vibe-Code_*` tables) under an advisory lock. Idempotent. |
| `npm run vibe:check` | Table counts, settings, month-to-date spend, and asserts which database host resolved. |
| `npm run vibe:probe` | Probes the Anthropic gateway: streaming, prompt caching, `output_config.effort`, and which parameters it rejects. **Run this before changing the agent.** |
| `npm run vibe:smoke` | Runs one real generation end to end and prints the cost ledger. Pass a session id to exercise the edit path. |
| `npm run vibe:hash` | Produces the admin password hash. Never prints the plaintext. |

### What it costs

Measured against the live gateway, not estimated:

| | Output tokens | Cost |
|---|---|---|
| First generation | 5.2k–6.2k | **$0.15–0.17** |
| Surgical edit | ~170 | **$0.04** |
| Broad restyle (rewrites) | ~6.3k | **$0.19** |
| Failed edit + fallback | two calls | **$0.43** |

A real five-turn session lands around **$0.45–0.70**. Spending is capped three ways, all
re-checked before *every* model call: monthly (default $100), daily (default $8, so one viral
day cannot black out the rest of the month), and per session ($1.00). Both budgets are editable
at `/vibe/admin`.

### Admin

`/vibe/admin`, reached by clicking the small dot in the studio's status bar seven times, or with
`Ctrl+Shift+Alt+H`. The URL works directly — the hidden trigger is discovery, not security. It
shows spend against both budgets, leads, stored designs, per-day usage, and the SEARCH/REPLACE
fallback rate.

Access is one shared password across `VIBE_ADMIN_EMAILS`, so the signed-in name is
self-asserted rather than proven; the console says so instead of implying an audit trail that
does not exist.

### Security notes

- The preview iframe is `sandbox="allow-scripts"` and nothing else. Adding `allow-same-origin`
  would cancel the sandbox — `srcDoc` inherits the embedder's origin, so model-written code
  driven by a stranger's prompt could read cookies, call the admin API with an admin's session,
  or rewrite the parent page under our own certificate.
- Generated HTML is **reconstructed** with `parse5`, not scrubbed with regexes: we own `<head>`,
  so the injected CSP is provably first and `<base>` / `<meta refresh>` cannot survive.
- **The HTML is not secret.** There is no download button, but anyone who opens DevTools can read
  the document. What the absence of a download buys is friction and framing, not protection.
- Visitor IPs are never stored — only an HMAC of the /32 (IPv4) or /64 (IPv6) block.

---

## Sanity webhook (on-demand revalidation)

`/api/revalidate` revalidates the right paths/tags whenever an `insight` document is created, updated, or deleted.

In <https://sanity.io/manage> → **API → Webhooks → Create webhook**:

- **Name**: `Next revalidate`
- **URL**: `https://<your-domain>/api/revalidate`
- **Dataset**: `production`
- **Trigger on**: Create, Update, Delete
- **Filter** (optional): `_type == "insight"`
- **Projection** (recommended — matches what `route.ts` reads):

  ```
  { _type, "slug": slug.current }
  ```

- **HTTP method**: `POST`
- **Secret**: paste the same `SANITY_REVALIDATE_SECRET` that's set in your hosting environment

Verification:

```bash
# Without a valid signature, the endpoint must return 401
curl -i -X POST https://<your-domain>/api/revalidate
```

Then publish or edit an `insight` in Studio — `/insights` and the slug page should reflect the change within seconds.

---

## Post-deploy checklist

- [ ] `https://<domain>/` loads
- [ ] `https://<domain>/studio` loads and login works (CORS configured)
- [ ] `https://<domain>/sitemap.xml` and `/robots.txt` resolve
- [ ] Editing an `insight` in Studio updates `/insights` and the slug page within seconds
- [ ] `POST /api/revalidate` without a signature returns `401`

---

## Project layout

```
src/
  app/                  Next.js App Router routes
    api/revalidate/     Sanity webhook → revalidatePath / revalidateTag
    insights/           CMS-backed listing + [slug]
    studio/             Embedded Sanity Studio (/studio)
  components/           UI components (Navbar, MobileMenu, LogoMark, …)
  sanity/               Sanity client, env, schemas, queries
public/                 Static assets (brand, og images, etc.)
sanity.config.ts        Studio configuration (basePath: '/studio')
next.config.js          Next config (allows cdn.sanity.io images)
```
