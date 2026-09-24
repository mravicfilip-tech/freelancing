# Deploying

Production is a static Vite build on Vercel:
**https://phorcast-markets.vercel.app**. There is no server code, no
environment variable the app reads, and no secret in the repository.

## 1. `vercel.json`

| Setting | Value | Why |
|---|---|---|
| `framework` | `vite` | |
| `buildCommand` | `npm run build` | `tsc --noEmit && vite build`; a type error fails the deploy |
| `outputDirectory` | `dist` | |
| `rewrites` | `/(.*)` to `/index.html` | Client-side routing: `/about` and any unknown path are served the app, and `src/lib/router.ts` decides what to render |
| `headers` | `/assets/(.*)`: `Cache-Control: public, max-age=31536000, immutable` | Vite fingerprints everything in `dist/assets/`, so it can be cached forever |

Vercel builds on its own machines from the uploaded source, using Node from
the project settings (the repo asks for Node 22: `.nvmrc`, `engines`).

## 2. `scripts/deploy.sh`

Always deploy with this script:

```
./scripts/deploy.sh
```

A bare `vercel deploy` skips both the account check and the alias step. In
order, the script:

1. **Reads a token** from the file named by `VERCEL_TOKEN_FILE` (default
   `~/.vercel-token`). Only if that file is missing does it fall back to a
   `VERCEL_TOKEN` environment variable. The file wins on purpose: a machine can
   carry a `VERCEL_TOKEN` for some other account, and reading the environment
   first is how this project was once deployed to the wrong account.
2. **Resolves the token to an account** (`GET https://api.vercel.com/v2/user`)
   and **refuses to continue** unless the email matches `VERCEL_ACCOUNT`. The
   default is the current owner's account, set near the top of the script.
   Nothing is uploaded before this check passes.
3. Runs `tsc --noEmit`.
4. Runs `vercel deploy --prod --yes` against the project linked in `.vercel/`,
   writes the output to a temp file and reads the deployment URL from it.
5. **Re-points the alias**: `vercel alias set <deployment> $DEPLOY_DOMAIN`
   (default `phorcast-markets.vercel.app`).
6. Reads `vercel alias ls` back and fails if the domain is not in it.

**Why step 5 exists.** A `.vercel.app` alias is bound to a *deployment*, not to
the project. It does not follow a new production build the way a custom domain
attached to the project does. Deploy without re-pointing and the public URL
keeps serving the previous build.

**After every deploy**, confirm rather than trusting the output:

```
npx vercel alias ls --token "$(cat ~/.vercel-token)"
```

The `phorcast-markets.vercel.app` row should point at the deployment URL the
script just printed. It has silently stayed on an old build before.

Settings (all optional environment variables):

| Variable | Default | Meaning |
|---|---|---|
| `VERCEL_TOKEN_FILE` | `~/.vercel-token` | File holding the token |
| `VERCEL_TOKEN` | | Used only when the file is missing |
| `VERCEL_ACCOUNT` | the current owner's email | Account the token must belong to |
| `DEPLOY_DOMAIN` | `phorcast-markets.vercel.app` | Alias to re-point |

Requirements: bash, curl, python3, Node 22 with dependencies installed, and a
project link in `.vercel/` (`npx vercel link`). The Vercel CLI is fetched by
`npx`. The `NODE_USE_ENV_PROXY` / `NODE_EXTRA_CA_CERTS` lines are for machines
behind an egress proxy and are harmless elsewhere.

## 3. Deploying from your own Vercel account

The account guard is not something to route around. Tell it deliberately which
account is now correct:

```
npx vercel login
npx vercel link                      # creates .vercel/ for your project (gitignored)
# create a token at vercel.com/account/tokens and save it as the only line of
# ~/.vercel-token, using an editor rather than a shell command so it does not
# land in shell history
chmod 600 ~/.vercel-token
VERCEL_ACCOUNT=you@example.com DEPLOY_DOMAIN=your-site.vercel.app ./scripts/deploy.sh
```

If the move is permanent, change the two defaults in the script
(`VERCEL_ACCOUNT` and `DEPLOY_DOMAIN`) in a commit. **Do not delete the check.**

If the site moves to a custom domain attached to the Vercel project, that
domain follows production builds on its own, and step 5 only matters for the
`.vercel.app` alias.

Git-based deploys (connecting the repository in the Vercel dashboard) also
work with `vercel.json` as it is, but they bypass this script: the account is
whichever one owns the Vercel project, and `.vercel.app` aliases other than
the project's own production domain will not move.

## 4. Secrets and local files

- No token, project id or link belongs in the repository. `.gitignore`
  excludes `.vercel` and `.env*`, and nothing in the build reads an
  environment variable.
- Never write a token into `scripts/deploy.sh`, a tracked file, a comment or
  a commit message. Keep it in `~/.vercel-token` with mode 600.
- `.vercel/project.json` (created by `vercel link`) holds your project and
  org ids. It is local to your machine.

## 5. Pre-deploy checklist

```
npm run check            # typecheck, lint, production build
npm run preview          # look at dist/ locally: /, /about, both themes
./scripts/deploy.sh
npx vercel alias ls ...  # confirm the alias moved
```
