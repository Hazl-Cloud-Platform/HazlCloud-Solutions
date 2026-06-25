#!/usr/bin/env bash
# Compile the app's Tailwind + custom CSS into a single static stylesheet that
# design-sync uses as cfg.cssEntry. Re-run whenever globals.css, the components,
# or authored previews change (the converter scrapes the file but never runs
# Tailwind itself). Output: .design-sync/compiled.css
set -euo pipefail
cd "$(dirname "$0")/.."

npx tailwindcss \
  -c .design-sync/tailwind.config.js \
  -i src/app/globals.css \
  -o .design-sync/.tw.css \
  >/dev/null 2>&1

cat .design-sync/css-header.css .design-sync/.tw.css > .design-sync/compiled.css
echo "wrote .design-sync/compiled.css ($(wc -c < .design-sync/compiled.css) bytes)"
