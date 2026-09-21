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
# The token comes from VERCEL_TOKEN, or from the file named by VERCEL_TOKEN_FILE
# (default ~/.vercel-token). The file is the one to use: it lives outside the
# repository, so the token is never a candidate for being committed, and the
# environment's own VERCEL_TOKEN may belong to a different account than the one
# this site ships from. Never write a token into this file or anywhere else
# under the repo.
#
# The two NODE_ vars are this sandbox's egress proxy: Vercel's uploader uses
# Node's built-in fetch, which ignores HTTPS_PROXY and will abort a large
# upload partway through without them.
set -euo pipefail

DOMAIN="${DEPLOY_DOMAIN:-phorcast-app.vercel.app}"
cd "$(dirname "$0")/.."

TOKEN_FILE="${VERCEL_TOKEN_FILE:-$HOME/.vercel-token}"
if [ -z "${VERCEL_TOKEN:-}" ] && [ -r "$TOKEN_FILE" ]; then
  VERCEL_TOKEN=$(tr -d '\r\n' < "$TOKEN_FILE")
fi
: "${VERCEL_TOKEN:?no token: set VERCEL_TOKEN or put one in $TOKEN_FILE}"
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
