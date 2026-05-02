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
