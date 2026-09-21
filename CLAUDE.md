# Phorcast

## Deployment — read before touching anything that ships

**Phorcast deploys to the `cleavegfx@gmail.com` Vercel account, and only that
account.** Team `cleavegfx-5253`, project `phorcast`.

This is not a preference. The site was previously deployed to
`mravicfilip@gmail.com` by mistake, and that account is retired for this
project and for future ones. **Never deploy to it again.**

The trap, so nobody walks into it twice: this sandbox carries a `VERCEL_TOKEN`
environment variable belonging to the *old* account. A token is opaque —
nothing about it says whose it is — so reading the environment and deploying is
exactly how the wrong account gets used.

Three things guard against that, and none of them should be removed:

1. `scripts/deploy.sh` reads its token from `~/.vercel-token` (or
   `VERCEL_TOKEN_FILE`) and the **file wins over the environment**.
2. Before any artefact is uploaded, the script resolves the token to an account
   and **refuses to continue** unless it is `cleavegfx@gmail.com`. If the
   account ever genuinely changes, set `VERCEL_ACCOUNT` deliberately rather than
   deleting the check.
3. `.vercel` and `.env*` are gitignored. Tokens and project links never go in
   the repository. Do not write a token into a tracked file, a commit message,
   a comment or a script.

Always deploy with `./scripts/deploy.sh`. A bare `vercel deploy` skips the
account check.

A `.vercel.app` alias binds to a *deployment*, not to a project, so it does not
follow a new production build. The script re-points it every time, which is the
reason it exists. Confirm with `vercel alias ls` afterwards rather than trusting
the deploy output — it has silently stayed on an old build before.
