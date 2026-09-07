#!/usr/bin/env bash
# Production deploy with retries; never aliases unless a fresh deployment URL came back.
set -u
L="${TMPDIR:-/tmp}/remittix-deploy.log"
U=""
for i in 1 2 3 4; do
  npx vercel deploy --prod --yes --token="$VERCEL_TOKEN" > "$L" 2>&1
  U=$(grep -Eo 'https://remittix-[a-z0-9]+-filip-mravic-s-projects\.vercel\.app' "$L" | sort -u | head -1)
  if [ -n "$U" ] && grep -q '"readyState": "READY"' "$L"; then break; fi
  U=""; echo "deploy attempt $i failed: $(grep -o '"message": "[^"]*"' "$L" | head -1)"; sleep $((2 ** i))
done
if [ -z "$U" ]; then echo "DEPLOY FAILED — aliases untouched"; exit 1; fi
echo "URL $U"
for A in remittix-site.vercel.app remittix-hero.vercel.app; do
  npx vercel alias set "$U" "$A" --token="$VERCEL_TOKEN" 2>&1 | tail -1
done
echo "local:"; ls dist/assets/index-*.js dist/assets/index-*.css | xargs -n1 basename
echo "deployed:"; npx vercel inspect "$U" --logs --token="$VERCEL_TOKEN" 2>&1 | grep -o "index-[A-Za-z0-9_-]*\.\(js\|css\)" | sort -u
