#!/usr/bin/env bash
# Copy the host-app brand assets into the bundle so LogoMark/Navbar/Hero render
# their logo (the component references the absolute path /brand/...png). Run
# after every full package-build (which wipes ds-bundle/). The brand/ dir is
# uploaded with the bundle so the cards render in the claude.ai/design pane too.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p ds-bundle/brand
cp -f public/brand/* ds-bundle/brand/
echo "copied public/brand -> ds-bundle/brand ($(ls ds-bundle/brand | wc -l | tr -d ' ') files)"
