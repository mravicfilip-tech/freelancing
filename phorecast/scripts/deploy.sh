#!/usr/bin/env bash
# Ship the site to production and point the project's domain at it.
#
#   ./scripts/deploy.sh
#
# Two steps, and the second one is the reason this file exists. A .vercel.app
# alias is bound to a DEPLOYMENT, not to the project, so it does not follow a
# new production build the way a custom domain would -- deploy alone and
# phorcast-app.vercel.app keeps serving whatever it was last pointed at. The
# alias has to be re-set every time, so it is scripted rather than remembered.
#
# Needs VERCEL_TOKEN in the environment. The two NODE_ vars are this sandbox's
# egress proxy: Vercel's uploader uses Node's built-in fetch, which ignores
# HTTPS_PROXY and will abort a large upload partway through without them.
set -euo pipefail

DOMAIN="${DEPLOY_DOMAIN:-phorcast-app.vercel.app}"
cd "$(dirname "$0")/.."

: "${VERCEL_TOKEN:?VERCEL_TOKEN is not set}"
export NODE_USE_ENV_PROXY=1
export NODE_EXTRA_CA_CERTS="${NODE_EXTRA_CA_CERTS:-/root/.ccr/ca-bundle.crt}"

echo "==> typecheck"
npx tsc --noEmit

echo "==> deploy to production"
# --yes skips the link prompt; the project is already linked in .vercel/.
URL=$(npx vercel deploy --prod --yes --token "$VERCEL_TOKEN" 2>/dev/null \
      | grep -oE 'https://[a-z0-9.-]+\.vercel\.app' | tail -1)

if [ -z "$URL" ]; then
  echo "could not read a deployment url from the vercel output" >&2
  exit 1
fi
echo "    $URL"

echo "==> point $DOMAIN at it"
npx vercel alias set "${URL#https://}" "$DOMAIN" --token "$VERCEL_TOKEN"

echo
echo "live: https://$DOMAIN"
