# design-sync notes — HAZL Solutions

This repo is a **Next.js 14 marketing site**, not a packaged component library.
It's synced to claude.ai/design via the design-sync **`package` shape** with a
**barrel entry** (no real `dist/` — the bundle is built from `.design-sync/ds-entry.tsx`,
which re-exports the components from `src/components/`).

## Target project
- Re-adopted the **existing** "HAZL Solutions Design System" project
  (`projectId` 019dc633-17a9-7cdd-89f2-323cf347e723) — a hand-built version of
  this same DS. **Atomic** upload path; the project has **no `_ds_sync.json`
  anchor** (different layout), so verification is full first-sync scope and the
  upload deletes are reviewed by hand from `list_files`.
- Close-out deletes the old hand-built layout: `ui_kits/`, `preview/`,
  `colors_and_type.css`, `SKILL.md`, `assets/`. **Keep** `docs/` and `uploads/`
  (original briefs + screenshots NOT in this repo — user chose to keep).

## Build / re-sync commands (run from repo root, in order)
```sh
ln -sfn ../.ds-sync/node_modules .design-sync/node_modules   # only if overrides/ forks exist (none today)
bash .design-sync/build-css.sh                               # Tailwind -> .design-sync/compiled.css (cfg.cssEntry)
node .ds-sync/package-build.mjs --config .design-sync/config.json \
  --node-modules ./node_modules --entry ./.design-sync/ds-entry.tsx --out ./ds-bundle
bash .design-sync/postbuild.sh                               # copy public/brand -> ds-bundle/brand
node .ds-sync/package-validate.mjs ./ds-bundle
node .ds-sync/package-capture.mjs --out ./ds-bundle
```

## Why these pieces (each is load-bearing)
- **Barrel entry `--entry ./.design-sync/ds-entry.tsx`**: makes `PKG_DIR` walk up
  to the real repo root (which has `src/`) WITHOUT a `node_modules` self-link.
  A self-link (`node_modules/hazl-solutions -> repo`) was tried first and caused
  **infinite ts-morph recursion** (`node_modules/hazl-solutions/node_modules/
  hazl-solutions/...`). Do NOT reintroduce it.
- **`cfg.componentSrcMap`** supplies the 8-component list (the repo ships no
  `.d.ts`, so `exportedNames` is empty) and binds each component's source for
  prop extraction.
- **`cfg.dtsPropsFor`** hand-writes real prop bodies — extracting from `.tsx`
  source yielded only `{[key]: unknown}`. Icons are typed structurally
  (`React.ComponentType<{size?; strokeWidth?; className?}>`) so the emitted
  `.d.ts` needs no lucide import. Keep these in sync if the component props change.
- **`cfg.srcDir = "src/components"`** scopes enrichment to the component files.
  All components land in group `general` (flat folder).
- **CSS**: `build-css.sh` compiles the app's Tailwind (`@tailwind` directives +
  custom classes) into `compiled.css` — the components' utility classes only
  exist if this ran. It also prepends a remote Google-Fonts **Inter** `@import`
  and defines `--font-inter` (the site uses `next/font/google`). `compiled.css`
  and `.tw.css` are gitignored; regenerate every clone/re-sync.
- **`next/link` shim**: `.design-sync/shims/next-link.tsx` (passthrough `<a>`),
  aliased in `.design-sync/tsconfig.dssync.json` (`cfg.tsconfig`). Navbar &
  MobileMenu import `next/link`; Hero pulls it in via Navbar.
- **Preview entrance-animation neutralizer**: `.design-sync/preview-lib/stage.tsx`
  injects a `<style>` that freezes `animate-blur-fade-up`/`reveal` at their final
  frame, so captures aren't caught mid-fade (the shipped `styles.css` keeps the
  animation for real designs — this only affects the preview cards). Without it,
  buttons/pills/navbar/strip captured at `opacity:0` (blank).
- **Brand assets**: `postbuild.sh` copies `public/brand/` into `ds-bundle/brand/`
  (uploaded too) so LogoMark/Navbar/Hero render their logo. Designs that use
  those components need the host to serve `/brand/hazlCloud-logo-bw2.png`.
- **Playwright** 1.57.0 (chromium build 1200) installed in `.ds-sync/`; chromium
  was already cached in `~/.cache/ms-playwright/` (no download).

## Known render warns (triaged benign — re-syncs: don't re-investigate)
- **MobileMenu `[RENDER_BLANK]`** (PNG ~4.5KB): the menu is absolutely positioned,
  which collapses validate's root measurement and the mostly-uniform-black PNG
  falls under the 5KB heuristic. The capture sheet confirms it renders correctly
  (dark dropdown, Approach/Insights/Contact). Non-blocking; do not "fix".
- **`[FONT_REMOTE] "Inter"`**: expected — Inter is loaded via a remote `@import`.

## Re-sync risks (watch-list for the next run)
- `.design-sync/node_modules` self-link, `compiled.css`, and `ds-bundle/` are
  gitignored — a fresh clone MUST run the commands above before anything else.
- Inter is a **remote** `@import`; offline/headless renders fall back to system
  sans. Acceptable, not byte-identical.
- The bundle is synthesized from `src/` (no real library build). If a component
  moves out of `src/components/`, is renamed, or a new one is added, update BOTH
  `ds-entry.tsx` AND `cfg.componentSrcMap` (and `dtsPropsFor` if it has props).
- `dtsPropsFor` is hand-maintained — it drifts silently if the component props
  change. Re-check against the source on a re-sync.
- `next/link` is shimmed: navigation in previews is inert (`<a href>` only).
