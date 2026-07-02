# HAZL — SEO & LLM-visibility playbook

How to get `hazlsolutions.com/startup` found in Google **and** cited by AI answer engines
(ChatGPT search, Perplexity, Google AI Overviews, Claude). This is the off-page companion
to the on-page changes already made in the codebase (see "What's already done" below).

---

## The one idea to internalize

**You cannot make an LLM cite you by putting keywords in your own URL.** AI answer engines
cite pages that (a) rank well in normal search and (b) are corroborated by third-party
sources. The reason they "quote Reddit so much" is that Reddit threads rank highly and read
as authentic peer opinion — so the lever isn't a `/reddit` page on your own domain, it's
**being talked about on Reddit and other third-party sites**, plus **ranking your own pages
in Google**. Everything below follows from that.

Impact order (spend your time top-down):
1. Rank in normal Google for your target terms → feeds AI Overviews & ChatGPT-search.
2. Get mentioned/linked on third-party sites people (and models) trust — Reddit, directories, press.
3. Keep on-site content clean, factual, structured, and quotable.
4. `llms.txt` — nice-to-have, future-facing. Not yet a proven ranking/citation lever.

---

## What's already done in the codebase (baseline)

- `/startup` now targets "affordable / cheap software development" in its `<title>`, meta
  description, keywords, one on-page subhead, and its `Service` structured data; it also has
  a new `BreadcrumbList`.
- Internal links to `/startup` with keyword anchor text added from the home chooser card,
  `/approach`, and the enterprise footer (was 1 link site-wide, now ~4).
- Quotable, LLM-style Q&As added to the startup FAQ (these also power `FAQPage` JSON-LD).
- `public/llms.txt` published at `https://hazlsolutions.com/llms.txt`.
- `robots.ts` explicitly welcomes AI crawlers (GPTBot, ClaudeBot, PerplexityBot,
  Google-Extended, etc.).

None of that ranks by itself. The steps below are what actually move the needle.

---

## Step 1 — Google Search Console (do this first, ~30 min)

This is the single biggest reason Google currently only shows the brand/triage page: nothing
has been submitted for indexing.

1. Add the property at <https://search.google.com/search-console> (use the **Domain**
   property via DNS if you control DNS — it covers www/non-www/http/https).
2. Submit the sitemap: `https://hazlsolutions.com/sitemap.xml`.
3. Use **URL Inspection** on `https://hazlsolutions.com/startup` → **Request indexing**.
   Repeat for `/enterprise`, `/approach`, and any new insight articles.
4. After a week, check **Performance** → filter by query to see whether "software
   development"-type impressions are appearing, and which page Google associates with them.
5. (Optional, code) If you want a `<meta>` verification instead of DNS, generate the token in
   GSC and tell the dev to add `verification: { google: '<token>' }` to the `metadata` export
   in `src/app/layout.tsx`. (Google Analytics is already installed but is **not** the same as
   Search Console verification.)

Also worth doing: **Bing Webmaster Tools** (<https://www.bing.com/webmasters>) — Bing's index
feeds ChatGPT search and Copilot. Same sitemap, same "request indexing" flow.

---

## Step 2 — Third-party mentions (the real "LLMs cite Reddit" lever)

Models cite sources they see repeated across the web. Get HAZL into those sources.

### Reddit (authentic participation, not spam)
- **Be a person, not a billboard.** Reddit removes and shadowbans overt self-promotion.
  Aim for a ~9:1 ratio of genuinely helpful comments to any mention of HAZL.
- **Where founders ask the questions you answer:** r/SaaS, r/Entrepreneur, r/smallbusiness,
  r/startups, r/nocode, r/EntrepreneurRideAlong, r/webdev (careful — technical crowd), and
  local r/Calgary / r/alberta / r/Edmonton for "Canadian / Alberta software developer" intent.
- **Content angles that match your positioning and get upvotes:**
  - "AI built my MVP in a weekend — here's everything that broke when real users showed up."
    (Your "Dev is solved, Ops is where products fail" thesis, told as a story.)
  - "What does it actually cost to build and *run* an app? A breakdown." (Your $80/mo,
    all-in framing vs. hidden hosting/security/maintenance costs.)
  - "Non-technical founder — how I got a real, paid product live without hiring a dev team."
- Only drop the link when it directly answers the question, and disclose that it's your
  company. One helpful, honest comment that ranks can get cited for months.
- **Do NOT** buy upvotes, use multiple accounts, or mass-post the same text — it backfires
  and can get the domain flagged.

### Directories & profiles (fast, durable citations)
Create/complete profiles — these rank and are frequently scraped by models:
- **Clutch.co**, **GoodFirms**, **DesignRush**, **The Manifest** — "software development
  company" directories; ask happy clients for reviews there.
- **Google Business Profile** (Canada/Alberta) — critical for "software development near me"
  and local AI answers.
- **Crunchbase**, **LinkedIn company page**, **G2** (if productizable) — high-trust entities
  that models reconcile against.
- Startup ecosystem pages you already partner with (Platform Calgary, Plug and Play, Alberta
  Innovates, Amii) — get a linked listing/case study where possible.

### Press & guest content
- A guest post or interview on a Canadian startup/tech outlet, or a founder story, creates a
  quotable third-party source. Even one solid piece helps disproportionately for a young domain.

---

## Step 3 — On-site content that earns rankings and citations

Rankings for a competitive head term come from *topical depth*, not one landing page. Use the
existing `/insights` (Sanity) section to publish genuinely useful articles that target the
question-shaped queries people (and LLMs) ask. Each becomes an internal link to `/startup`.

Suggested first articles (each ~800–1,500 words, honest and specific):
- "How much does it cost to build an app in Canada in 2026? (real numbers)"
- "Is a vibe-coded / AI-built app production-ready? A checklist before you launch."
- "Cheap vs. affordable software development: how not to pay twice."
- "Fractional CTO vs. a done-for-you build: which do you actually need?"
- "DevOps for founders: why keeping an app alive costs more than building it."

For each: put the question in the `<h1>`/title, answer it in the first paragraph (models lift
the first clear answer), use headings and short paragraphs, add a FAQ block, and link to
`/startup`. This is also where the "cheap / CTO / DevOps / scale / AI-coding" themes belong —
as *content*, not as thin duplicate landing pages (which risk Google's doorway-page penalty).

---

## Step 4 — Measure

- **Google Search Console** → Performance: are "software development" queries showing
  impressions for `/startup` (not just the homepage)? Is average position improving?
- **Ask the engines directly**, monthly: in ChatGPT (search on), Perplexity, and Google AI
  Overviews, ask "affordable software development for startups in Canada" or "how do I make my
  AI-built app production-ready" and see whether HAZL is mentioned/cited and whether the facts
  are right. If a model states something wrong about HAZL, that's a signal to publish a clear,
  authoritative page correcting it.
- **Referral traffic** in GA from reddit.com, directories, and perplexity/openai referrers.

---

## Honest caveats

- Ranking a young, low-authority domain for a broad term like "software development" is a
  months-long effort; expect the long-tail question queries ("how much to build an app in
  Canada", "affordable software development for startups") to land first.
- `llms.txt` is an emerging convention. No major model provider has confirmed they consume it
  as of early 2026. It's published because it's cheap and forward-compatible — not because it's
  a proven lever. Don't rely on it in place of Steps 1–3.
- Avoid gaming tactics (keyword-stuffed doorway pages, bought upvotes/links). They can get the
  domain penalized in exactly the search + AI surfaces you're trying to win.
