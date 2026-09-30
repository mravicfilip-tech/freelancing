#!/usr/bin/env bash
# Deploys brand-presentation.html (at /) and the asset kit board (at /kit/, with the kit zip) to the standalone
# Vercel project "ml-brand-presentation" (kept separate from the main "freelancing" site). Needs VERCEL_TOKEN.
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
# asset kit board at /kit/: the page plus the files it shows, and the zip as a download
kit="$here/../assets/kit"; mkdir -p "$out/kit"
{
  printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  printf '<link rel="icon" type="image/svg+xml" href="../favicon.svg">\n'
  sed 's#sits beside them as <code>ml-asset-kit.zip</code>#is here: <a href="ml-asset-kit.zip" style="color:var(--signal)">download ml-asset-kit.zip</a>#' "$kit/kit-board.html"
  printf '\n</html>\n'
} > "$out/kit/index.html"
(cd "$kit" && grep -oE '(src|href)="(logo|patterns|templates)/[^"]+"' kit-board.html | sed 's/.*="//;s/"$//' | sort -u \
  | while read -r f; do mkdir -p "$out/kit/$(dirname "$f")"; cp "$f" "$out/kit/$f"; done)
cp "$kit/ml-asset-kit.zip" "$out/kit/"
cd "$out" && npx -y vercel@latest deploy --prod --yes --token "$VERCEL_TOKEN"
