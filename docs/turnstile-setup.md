# Cloudflare Turnstile setup — handoff for Claude Desktop

**How to use this file:** open Claude Desktop (which can drive your logged-in Chrome),
paste the whole "Task" section below, and let it work through the steps. Then bring the two
keys back here — or run the two `doppler secrets set` commands yourself at the end.

**Why this exists:** Claude Code (the terminal agent that built this feature) has no browser
control — the Claude Chrome extension is a different surface. It *can* write the secrets into
Doppler once the keys exist.

**Faster alternative, no browser at all:** if you create a Cloudflare API token with the
`Turnstile Sites Write` permission, the whole widget can be created from the terminal and the
create response returns *both* keys. See "Option B" at the bottom.

---

## Task (paste this into Claude Desktop)

> Please set up a Cloudflare Turnstile widget for me in my browser. I'm already signed in to
> Cloudflare in Chrome.
>
> 1. Go to `https://dash.cloudflare.com/?to=/:account/turnstile`.
> 2. Click **Add widget**.
> 3. Fill in exactly these values:
>    - **Widget name:** `HAZL Vibe Studio`
>    - **Hostnames:** add **`hazlsolutions.com`** and, on a second row, **`localhost`**
>    - **Widget Mode:** `Managed`
>    - **Pre-clearance:** leave off
> 4. Click **Create**.
> 5. On the success screen, copy the **Site Key** and the **Secret Key** and give them both
>    back to me in your reply. The site key is public; the secret key is not — don't put it
>    anywhere else.
>
> Notes so you get the fields right:
> - Hostnames must be bare fully-qualified domains. No `https://`, no port, no path, no
>   wildcards. `hazlsolutions.com` is rejected if typed as `https://hazlsolutions.com`.
> - Adding `hazlsolutions.com` **automatically covers every subdomain**, including
>   `www.hazlsolutions.com`, which is the hostname this site actually serves. Do not add
>   `www.` separately — and note that adding only `www.hazlsolutions.com` would *not* cover
>   the apex, so the bare domain is the one to use.
> - `localhost` is **not** allowed implicitly and must be added explicitly, otherwise local
>   development fails.
> - If the dashboard offers a **Set up with Spin** button, that also works and adds
>   `localhost` automatically.

---

## After you have the keys

Either paste them back to Claude Code, or run these yourself:

```bash
echo -n '0x4AAAAAAA...' | doppler secrets set NEXT_PUBLIC_TURNSTILE_SITE_KEY -p hazl-general -c prd
echo -n '0x4AAAAAAA...' | doppler secrets set TURNSTILE_SECRET_KEY          -p hazl-general -c prd
```

The site key is public (it ships in the page HTML, hence the `NEXT_PUBLIC_` prefix). The secret
key is server-only and must never reach the browser.

---

## Option B — no browser, via the API

Create a Cloudflare API token with **`Turnstile Sites Write`** (Account scope) at
<https://dash.cloudflare.com/profile/api-tokens>, then:

```bash
curl -sS "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/challenges/widgets" \
  --request POST \
  --header "Authorization: Bearer $CF_API_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{
    "name": "HAZL Vibe Studio",
    "domains": ["hazlsolutions.com", "localhost"],
    "mode": "managed"
  }'
```

The response contains **both** `result.sitekey` and `result.secret` — the only clean way to get
the secret without the dashboard. `npx wrangler turnstile widget create "HAZL Vibe Studio"
--domain hazlsolutions.com --domain localhost --mode managed` does the same thing.

---

## How it is wired up here

| Where | What |
|---|---|
| `src/lib/vibe/turnstile.ts` | Server-side `siteverify`. Fails **closed**: a missing secret in production makes every generation 403, and a network error or a 5-second timeout counts as a failure — a Cloudflare blip must never become an hour of unmetered LLM access. |
| `src/components/vibe/TurnstileGate.tsx` | Client widget, via `@marsidev/react-turnstile` (the package Cloudflare explicitly endorses; they publish no official React guide). |
| `src/app/api/vibe/chat/route.ts` | Challenges the first generation of a session **and re-challenges after two turns**. Gating only the very first turn would leave the expensive later turns behind a challenge that costs a bot a fraction of a cent. |

Tokens are **single-use** with a **300-second** lifetime, so the widget is reset after every
submit and each token is verified once with an `idempotency_key`. The response's `hostname` and
`action` are both checked — a valid token issued for someone else's site is still a valid token.

### Local development

Without `TURNSTILE_SECRET_KEY` set, verification is skipped when `NODE_ENV !== 'production'`, so
the studio runs locally with no Cloudflare account at all. To exercise the real path, use
Cloudflare's official test keys (they need no hostname configuration):

| Purpose | Site key | Secret key |
|---|---|---|
| Always passes | `1x00000000000000000000AA` | `1x0000000000000000000000000000000AA` |
| Always fails | `2x00000000000000000000AB` | `2x0000000000000000000000000000000AA` |
| Token already spent | — | `3x0000000000000000000000000000000AA` |

Test site keys must be paired with test secret keys; production keys reject the dummy token and
vice versa.

### Content-Security-Policy note

If a CSP is ever added to the site itself, the studio page needs
`script-src https://challenges.cloudflare.com` and `frame-src https://challenges.cloudflare.com`.
That is separate from the CSP injected into generated mockups, which is deliberately much
stricter and lives in `src/lib/vibe/sanitizeHtml.ts`.
