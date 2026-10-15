# Environment notes

Traps the cloud container and the Vercel Hobby plan have set more than once. Read once per session
before the first shot, server restart or deploy. Add a line the same turn a new trap costs a retry,
so the lesson outlives the context window.

## Processes

- Never `pkill -f`. Its pattern matches the agent's own shell and kills it. Free a port with
  `fuser -k <port>/tcp`, or kill the one PID that `lsof -ti :<port>` prints.
- Never wait on `pgrep -f` either. Its pattern matches the waiting loop's own shell, so the loop
  never ends. Wait on a PID with `while kill -0 <pid>`, or on a file the job writes.
- The cloud stop hook asks for a commit whenever the working tree is dirty. Builders work in their
  own git worktree, per build recipe step 2, so the main tree stays clean while they run.

## Git

- A repo cloned with `--depth 1` tracks only its default branch, so `git push -u` of a new branch
  leaves no remote tracking ref and the stop hook calls it unpushed. After the first push, run
  `git config --add remote.origin.fetch '+refs/heads/<branch>:refs/remotes/origin/<branch>'`, then
  `git fetch origin <branch>` and `git branch -u origin/<branch>`.

## Shots

- The container has 4 cores and no GPU. WebGL renders in software. Wait 9000 to 13000ms per frame
  before a 3D shot, or the frame comes out blank or half drawn.
- A 1920 frame of a 3D scene takes about 40 seconds, and a 38 screen board about 25 minutes. Interim
  shots cover the changed beats only, one frame per fix, on one contact sheet. The full board is shot
  once, at round end.
- Several 3D builders shooting at once pushed the load to 18 on 4 cores. A heavy 3D slice goes to its
  own cloud session on a `<branch>-<slice>` branch rather than a fourth builder in the same container.
- A full page shot of a page with infinite CSS loops can come out with far sections blank or caught
  mid reveal, though the DOM says they are shown. Full page shots run with reduced motion. Motion is
  checked in viewport shots, taken 2500ms or more after the section's reveal starts.

## Network

- The agent proxy blocked `vercel.app` before, and let it through on 2026-10-15, so a public deployment
  can be checked with curl or Playwright. A deployment behind Vercel Authentication still can't be opened
  from here. Check it through the Vercel API, as `studio/scripts/deploy.mjs` does, and send Filip the link.

## Vercel Hobby

- 100 deploys a day across the account. Git previews of every linked project count, and hitting the
  cap returns a 402 that blocks production too.
- A git deploy of a commit an agent authored is refused. Deploy with
  `node studio/scripts/deploy.mjs --dir <project>`, which uploads a copy with no git history.
- The first deploy of a new project goes to production even without `--prod`. ovallo-landing's first
  deploy did, on 2026-10-15. `deploy.mjs` now passes `--target preview` for every preview.
- CLI 64 labels its output lines, "Production  https://..." and "Aliased  https://...", so a check for a
  bare URL line called a READY deploy a failure. `deploy.mjs` now reads labelled lines and falls back to
  the project's newest deployment through the API. Check the API before retrying a "failed" deploy.
- A client fork whose Vercel projects sit in the client's account gets its own project in Filip's
  team. Create it through the API, link it by writing `.vercel/project.json`, and register it with
  `registry.mjs add <id> --project <name>`. A new project starts with Vercel Authentication on every
  deployment except custom domains, so its links open only for someone logged in to Filip's team.
  To open production only, PATCH the project with `ssoProtection` `{ "deploymentType": "preview" }`.
  Previews stay behind the login.
- Turn off git deploys for agent branches in each project's `vercel.json`.

```json
{ "git": { "deploymentEnabled": { "claude/*": false } } }
```
