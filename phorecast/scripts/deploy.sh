#!/usr/bin/env bash
# Ship the site to Vercel production and point the public domain at it.
#
#   ./scripts/deploy.sh
#
# Always deploy with this script, never with a bare `vercel deploy`, which
# skips the account check below. In order, it:
#
#   1. reads a Vercel token (see TOKEN below),
#   2. asks Vercel whose account that token opens, and REFUSES TO CONTINUE
#      unless it is the account this site ships from,
#   3. typechecks, then runs `vercel deploy --prod` (Vercel builds with
#      `npm run build`, per vercel.json),
#   4. points DEPLOY_DOMAIN at the new deployment and reads the alias table
#      back to confirm it took.
#
# Step 4 is why the script exists. A .vercel.app alias is bound to a
# DEPLOYMENT, not to the project, so it does not follow a new production build
# the way a custom domain would: deploy alone and the domain keeps serving the
# previous build. It has to be re-pointed every time, so it is scripted rather
# than remembered. Check `npx vercel alias ls` afterwards if in doubt.
#
# NEEDS: bash, curl, python3, Node 22 with this project's dependencies
# installed, and a project link in .vercel/ (created by `npx vercel link`; it
# is gitignored). The Vercel CLI is fetched by npx on first use.
#
# SETTINGS, all optional, all environment variables:
#
#   VERCEL_TOKEN_FILE  file holding the token.        default ~/.vercel-token
#   VERCEL_TOKEN       the token itself, used only when that file is missing
#   VERCEL_ACCOUNT     email of the account the token must belong to.
#                                                    default cleavegfx@gmail.com
#   DEPLOY_DOMAIN      alias to point at the build.
#                                          default phorcast-markets.vercel.app
#
# TOKEN. The file wins over the environment on purpose: a machine can carry a
# VERCEL_TOKEN for some other account, and reading the environment first is
# exactly how this project was once deployed to the wrong account. Keep the
# token in a file outside the repository, readable only by you
# (chmod 600 ~/.vercel-token). Never write a token into this script, a
# tracked file or a commit.
#
# DEPLOYING FROM YOUR OWN VERCEL ACCOUNT. The guard is not a bug to route
# around; tell it deliberately which account is now correct:
#
#   npx vercel login && npx vercel link        # links .vercel/ to your project
#   # create a token at vercel.com/account/tokens, save it as the only line
#   # of ~/.vercel-token (in an editor, not on the command line), then:
#   chmod 600 ~/.vercel-token
#   VERCEL_ACCOUNT=you@example.com DEPLOY_DOMAIN=your-site.vercel.app \
#     ./scripts/deploy.sh
#
# If the move is permanent, change the two defaults below. Do not delete the
# check: it is the only thing standing between a stray token and the wrong
# account.
#
# The two NODE_ settings are for machines behind an egress proxy (the sandbox
# this was built in): Vercel's uploader uses Node's built-in fetch, which
# ignores HTTPS_PROXY and aborts large uploads partway through without them.
# They are harmless elsewhere.
set -euo pipefail

# phorcast-app.vercel.app was the domain while this site was on the old
# account, and it is still held there, so asking for it now fails with
# "already in use". The site lives at phorcast-markets on cleavegfx.
DOMAIN="${DEPLOY_DOMAIN:-phorcast-markets.vercel.app}"
cd "$(dirname "$0")/.."

# THE FILE WINS OVER THE ENVIRONMENT, and that order is the whole point. The
# sandbox this site was built in carries a VERCEL_TOKEN for a DIFFERENT account, and
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
if [ -z "${NODE_EXTRA_CA_CERTS:-}" ] && [ -r /root/.ccr/ca-bundle.crt ]; then
  export NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt
fi

echo "==> typecheck"
npx tsc --noEmit

echo "==> deploy to production"
# --yes skips the link prompt; the project is already linked in .vercel/.
#
# The output goes to a FILE and is grepped afterwards, rather than being piped
# straight into a command substitution. Piped, this step kept coming back empty
# on long uploads -- the url never arrived, the script exited, and the alias was
# left pointing at the previous build while the deploy itself had succeeded.
# That is how a bare `vercel deploy` started being run by hand, which skips the
# account check above and is the one thing this file exists to prevent.
LOG=$(mktemp)
trap 'rm -f "$LOG"' EXIT
npx vercel deploy --prod --yes --token "$VERCEL_TOKEN" > "$LOG" 2>&1 || true
URL=$(grep -oE 'https://[a-z0-9.-]+\.vercel\.app' "$LOG" | tail -1)

if [ -z "$URL" ]; then
  echo "could not read a deployment url from the vercel output:" >&2
  tail -20 "$LOG" >&2
  exit 1
fi
echo "    $URL"

echo "==> point $DOMAIN at it"
npx vercel alias set "${URL#https://}" "$DOMAIN" --token "$VERCEL_TOKEN"

# And read the alias back, because the one failure this script cannot see is the
# one that matters: a deploy that worked, an alias set that reported success,
# and the domain still serving the previous build.
echo "==> confirm"
npx vercel alias ls --token "$VERCEL_TOKEN" 2>/dev/null | grep -F "$DOMAIN" || {
  echo "alias $DOMAIN is not in the table" >&2
  exit 1
}

echo
echo "live: https://$DOMAIN"
