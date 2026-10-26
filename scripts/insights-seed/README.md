# Insights seed

Generates the quarterly Insights back-catalogue (Q1 2023 → Q4 2026) for Sanity:
article content as JSON, a designed infographic poster per article, and an
NDJSON file for `sanity dataset import`.

```
scripts/insights-seed/
  content/<quarter>.json   one article per file, e.g. 2023-q1.json (hand-written content)
  poster.tsx               React poster component (630×867 CSS px, rendered @2x)
  build.tsx                renders posters → out/posters/*.png, writes out/insights.ndjson
  out/                     generated, gitignored
```

## Content file schema (`content/<quarter>.json`)

```jsonc
{
  "quarter": "2023-Q1",
  "publishedAt": "2023-02-15T15:00:00.000Z",   // mid-quarter weekday; Q4 2026 must be ≤ 2026-10-20
  "title": "…",                                 // 10–120 chars
  "slug": "kebab-case-title",                  // ≤ 96 chars, unique
  "excerpt": "…",                               // 40–220 chars
  "seoTitle": "…",                              // ≤ 60 chars
  "seoDescription": "…",                        // 150–160 chars (max 170)
  "tags": ["AI", "DevOps"],                     // 3–5
  "body": [                                     // 700–1,100 words total
    { "style": "normal", "text": "Paragraph with **bold**, *italic* and [a link](https://example.com)." },
    { "style": "h2", "text": "Section heading" },
    { "style": "h3", "text": "Sub heading" },
    { "style": "blockquote", "text": "Pull quote" },
    { "style": "bullet", "text": "List item" }          // consecutive bullets form one list
  ],
  "poster": {
    "headline": "The AI Stability Gap:",          // ≤ 32 chars, big title line
    "subhead": "Why DevOps is the New Bottleneck", // ≤ 40 chars
    "tagline": "Building is now instant; operating is the new challenge.", // ≤ 70 chars
    "sections": [                                // exactly 4
      { "title": "≤ 30 chars, 2 lines max", "text": "≤ 95 chars", "icon": "Rocket" }
    ]                                            // icon = lucide-react export name
  },
  "sources": [{ "label": "…", "url": "https://…", "date": "2023-01-30" }]  // for fact-checking, not imported
}
```

Rules: an article only references events that were public before its
`publishedAt`. No invented clients, case-study metrics, quotes or statistics;
every statistic must appear in `sources`. Author for every article is the
"HAZL Solutions team" author document.
