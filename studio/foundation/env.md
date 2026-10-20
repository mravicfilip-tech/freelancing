# Environment notes

Traps the cloud container and the Vercel Hobby plan have set more than once. Read once per session
before the first shot, server restart or deploy. Add a line the same turn a new trap costs a retry,
so the lesson outlives the context window.

## Processes

- Never `pkill -f`. Its pattern matches the agent's own shell and kills it. Free a port with
  `fuser -k <port>/tcp`, or kill the one PID that `lsof -ti :<port>` prints.
- The cloud stop hook asks for a commit whenever the working tree is dirty. Builders work in their
  own git worktree, per build recipe step 2, so the main tree stays clean while they run.

## Worktrees

- Worktrees of one repo share a single `git stash` list. A builder that stashes and pops in its own
  worktree can pop another builder's changes. Builders never run `git stash`, they commit or copy.
- A worktree with `node_modules` symlinked from the main tree makes the Vite dev server answer 403
  on font files from packages, since they resolve outside the worktree root, and shots fall back
  to a system font. Run a real `npm install` in each worktree.

## Shots

- The container has 4 cores and no GPU. WebGL renders in software. Wait 9000 to 13000ms per frame
  before a 3D shot, or the frame comes out blank or half drawn.
- A 1920 frame of a 3D scene takes about 40 seconds, and a 38 screen board about 25 minutes. Interim
  shots cover the changed beats only, one frame per fix, on one contact sheet. The full board is shot
  once, at round end.
- Several 3D builders shooting at once pushed the load to 18 on 4 cores. A heavy 3D slice goes to its
  own cloud session on a `<branch>-<slice>` branch rather than a fourth builder in the same container.

## Lint

- In the freelancing repo `baselint.mjs` without `--client` reads the registry by repo name and picks
  remittix, so a bullhill diff is checked against the wrong scale. Pass `--client <id>` every time.

## Network

- The agent proxy blocks `vercel.app`, so a preview cannot be opened from inside the container. Check
  a deployment through the Vercel API, as `studio/scripts/deploy.mjs` does, and send Filip the link to click.
- The proxy blocks `pages.dev` the same way, a 502 on CONNECT. Check a Cloudflare Pages deployment through
  the Pages API and send Filip the link.

## Vercel Hobby

- 100 deploys a day across the account. Git previews of every linked project count, and hitting the
  cap returns a 402 that blocks production too.
- A git deploy of a commit an agent authored is refused. Deploy with
  `node studio/scripts/deploy.mjs --dir <project>`, which uploads a copy with no git history.
- Turn off git deploys for agent branches in each project's `vercel.json`.
- The first deploy of a new project goes to production and takes the `<project>.vercel.app` alias,
  even without `--prod`. BullHill, 14 October 2026. Before the first preview of a new project, ask
  Filip to make one production deploy himself or to accept that the first one is production.
- `vercel link` on a new project also connects the GitHub repo. The root `vercel.json` keeps
  `claude/*` pushes from building, but changing the link or the protection needs Filip.
- `deploy.mjs` misses the URL when the CLI prints it after a label such as `Production`, and
  reports a failure. Read the deployment through the API before calling it failed.
- A deploy can die mid upload with `fetch failed` or `AbortError` when the container's network drops.
  Production is untouched then. Check the alias through the API and run the same deploy again.

```json
{ "git": { "deploymentEnabled": { "claude/*": false } } }
```
