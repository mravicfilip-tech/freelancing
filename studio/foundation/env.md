# Environment notes

Traps the cloud container and the Vercel Hobby plan have set more than once. Read once per session
before the first shot, server restart or deploy. Add a line the same turn a new trap costs a retry,
so the lesson outlives the context window.

## Processes

- Never `pkill -f`. Its pattern matches the agent's own shell and kills it. Free a port with
  `fuser -k <port>/tcp`, or kill the one PID that `lsof -ti :<port>` prints.
- The cloud stop hook asks for a commit whenever the working tree is dirty. Builders work in their
  own git worktree, per build recipe step 2, so the main tree stays clean while they run.

## Shots

- The container has 4 cores and no GPU. WebGL renders in software. Wait 9000 to 13000ms per frame
  before a 3D shot, or the frame comes out blank or half drawn.
- A 1920 frame of a 3D scene takes about 40 seconds, and a 38 screen board about 25 minutes. Interim
  shots cover the changed beats only, one frame per fix, on one contact sheet. The full board is shot
  once, at round end.
- Several 3D builders shooting at once pushed the load to 18 on 4 cores. A heavy 3D slice goes to its
  own cloud session on a `<branch>-<slice>` branch rather than a fourth builder in the same container.

## Network

- The agent proxy has blocked `vercel.app` in some sessions, so a preview could not be opened from
  inside the container. Check a deployment through the Vercel API, as `studio/scripts/deploy.mjs`
  does, and send Filip the link to click. On 19 Oct 2026 it was open, and curl and a shot of the
  live link both worked, so try a curl first.

## Vercel Hobby

- 100 deploys a day across the account. Git previews of every linked project count, and hitting the
  cap returns a 402 that blocks production too.
- A git deploy of a commit an agent authored is refused. Deploy with
  `node studio/scripts/deploy.mjs --dir <project>`, which uploads a copy with no git history.
- `deploy.mjs` printed "vercel deploy failed" on 19 Oct 2026 for a deployment that was READY and
  aliased. The CLI writes its Production line to stderr, which the script does not read. Check the
  state with the API, `GET /v13/deployments/<host>`, before deploying again.
- Auto mode refuses a production deploy and any change to Deployment Protection, whatever Filip
  types in chat. He switches the mode dropdown to Accept edits, then the deploy asks and he approves.
- An app that imports from `studio/` at build time, such as a tailwind config that reads the
  preset, cannot build on Vercel from its own folder. Build locally and deploy `dist`, with a
  `vercel.json` holding the SPA rewrite inside `public/` so it lands in `dist`.
- Turn off git deploys for agent branches in each project's `vercel.json`.

```json
{ "git": { "deploymentEnabled": { "claude/*": false } } }
```

## Figma

- The Figma MCP on the Starter plan stops answering after a few dozen calls in a session, with a
  rate limit error that blocks every Figma tool. Read the frame list once with `get_metadata`, then
  ask `get_design_context` only for the few small nodes that hold tokens and assets, download every
  asset URL the same turn, and never request a whole screen frame, which comes back sparse anyway.

## Builder worktrees

- A helper started with worktree isolation gets a branch off the repo's default branch, not off the
  session branch. Telling it to merge the session branch in drags every newer default branch commit
  into its branch. Take a builder's work with `git cherry-pick <its commits>`, never `git merge` of
  its branch, and read `git show --stat` first so only its own folders come across.
