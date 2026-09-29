#!/usr/bin/env bash
# Deploys brand-presentation.html to the standalone Vercel project "ml-brand-presentation"
# (kept separate from the main "freelancing" site). Needs VERCEL_TOKEN.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
out="$(mktemp -d)/ml-brand-presentation"; mkdir -p "$out"
{
  printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  printf '<link rel="icon" type="image/svg+xml" href="favicon.svg">\n'
  cat "$here/brand-presentation.html"
  printf '\n</html>\n'
} > "$out/index.html"
cp "$here/old-logo.png" "$out/"
cp "$here/../assets/logo/o10/ml-symbol-signal.svg" "$out/favicon.svg"
cd "$out" && npx -y vercel@latest deploy --prod --yes --token "$VERCEL_TOKEN"
