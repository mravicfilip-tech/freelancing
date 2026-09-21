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

# THE FILE WINS OVER THE ENVIRONMENT, and that order is the whole point. This
# sandbox ships with a VERCEL_TOKEN belonging to a DIFFERENT account, and
# reading the environment first is exactly how this project was deployed to the
# wrong one. The file is the account this site belongs to.
TOKEN_FILE="${VERCEL_TOKEN_FILE:-$HOME/.vercel-token}"
if [ -r "$TOKEN_FILE" ]; then
  VERCEL_TOKEN=$(tr -d '\r\n' < "$TOKEN_FILE")
fi
: "${VERCEL_TOKEN:?no token: put one in $TOKEN_FILE, or set VERCEL_TOKEN}"

# And then prove whose it is before anything is uploaded. A token is opaque --
# nothing about it says which account it opens -- so the only way to keep a
# deployment off the wrong account is to ask, every time, and refuse. One
# request, before any build artefact leaves this machine.
EXPECT_ACCOUNT="${VERCEL_ACCOUNT:-cleavegfx@gmail.com}"
ACTUAL_ACCOUNT=$(curl -sS -H "Authorization: Bearer $VERCEL_TOKEN" \
  https://api.vercel.com/v2/user \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); u=d.get("user") or d; print(u.get("email",""))' \
  2>/dev/null || true)

if [ "$ACTUAL_ACCOUNT" != "$EXPECT_ACCOUNT" ]; then
  echo "refusing to deploy." >&2
  echo "  this token belongs to: ${ACTUAL_ACCOUNT:-<could not resolve>}" >&2
  echo "  this project ships to: $EXPECT_ACCOUNT" >&2
  echo >&2
  echo "  Phorcast is deployed ONLY from $EXPECT_ACCOUNT. If that has genuinely" >&2
  echo "  changed, set VERCEL_ACCOUNT to the new address deliberately -- do not" >&2
  echo "  delete this check." >&2
  exit 1
fi
echo "==> account $ACTUAL_ACCOUNT"
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
