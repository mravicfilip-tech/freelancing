# Studio doctrine

The light kit. It helps and never polices. Root is `studio/` in the freelancing repo, and
`~/.claude/studio` anywhere else the kit is installed. Every path in this file is relative to the
root unless it starts with `studio/` or `.claude/`. Commands run from the repo root. The root
CLAUDE.md owns the operating agreement, the kickoff gate, scope discipline and the regression rule.
This file adds to them and does not repeat them.

## Load

@foundation/writing.md

Writing rules load once through the pointer above. Never inline or restate them.

## Triggers

Each trigger fires on its own event and no other. None fires every turn or every edit.

- Before UI work in a client's folder, read `clients/<client>/README.md` and `clients/<client>/taste.md`
  once per session. Skip the read if both are already in context.
- `/newui` runs for every new UI, and by itself when a new client app starts with no
  `clients/<client>/kit/`. References, one argued direction, the hardest screen, a Radix or shadcn
  base, every state. It stops for Filip's pick twice. Steps are in `.claude/skills/newui/SKILL.md`.
- `/story` runs before anything is built when the job is a scroll story, a hero sequence or a 3D
  walk through. Decode the references, write the beats, build one beat in one version. No more
  than one built direction before Filip accepts the story. Steps are in `.claude/skills/story/SKILL.md`.
- Kit first. Before building any control or card, run
  `node studio/scripts/kit.mjs list --client <id>` and reuse what is there. Build a
  new one only when the kit has none for that job.
- Golden on accept. The turn Filip accepts a screen, record it with
  `node studio/scripts/golden.mjs add --client <id> --name <name> --url <url>`, and
  record each control or card he accepts with `kit.mjs add`. Later screens are checked with
  `golden.mjs compare`, so they match the first without a new round of picks.
- Variant board. Micro detail variants (motion, icons, states, loaders) go on one board with
  `node studio/scripts/variants.mjs --urls "1=<url>,2=<url>" --out <png>`. Filip
  answers with a number, then `/taste` logs it.
- Acceptance criteria. When the brief has the client's acceptance criteria, pull them into the plan
  and into the `/uireview` pack.
- Every UI build covers all states, empty, loading, error, long text and no access. Keep
  `clients/<client>/glossary.md` for UI terms and use its words in copy. A new client gets it from
  `clients/_template`.
- Keep `clients/<client>/tasks.md` current, and never ask permission to do it. When Filip hands
  over work, add a task under Backlog, or under In progress when it starts at once, titled the way
  he would say it out loud. Move the task between Backlog, In progress, Review and Done as its
  state changes. Add steps as the shape of the work becomes clear, and tick each step the moment
  the conversation shows it done. Ticking a step never moves the task. Steps never appear in
  anything Filip sends a client, a status note, an invoice line or a summary. Those read at task
  level. A session whose work maps to no task gets one added. A client with no folder yet gets one
  made with `node studio/scripts/registry.mjs add <id>`. When `/taste` marks a
  direction REJECTED or SUPERSEDED, its task moves to Done the same turn with "superseded by
  <task>" in its notes.
- `/taste`. The turn Filip picks, rejects, accepts, kills a direction or sets an app-wide ruling,
  run it. "Go with 3", "v3 is it" and "use this one" are picks, so run it the same turn. It writes
  the client `taste.md`. A preference that applies beyond one client goes in
  `foundation/principles.md`, never a project memory.
- App-wide ruling. "Rule it app wide" and "make this app wide" run `/taste` in app-wide mode. It
  writes the ruling to the client `taste.md` and, for a base layout value, to
  `clients/<client>/base-override.json`, then lists every place in the repo it applies before
  changing any.
- Base layout. UI work follows `foundation/base-layout.css` unless the client's
  `base-override.json` says otherwise. A new client gets `{}` from `clients/_template`. Run
  `node studio/scripts/baselint.mjs` before every preview link. It warns and never
  blocks.
- Interaction pass. When a build has a pinned bar, a menu, a popup or hover states, shoot it with
  `--interact`, so sticky layers, stacking, hover shifts and z-index values are checked by driving
  the page and not by reading the code.
- Standing yes. "Go" approves the last plan's recommendations and nothing else. Never a deploy, a
  send or a ship line.
- Progress line. When work runs in background helpers, say once what is running, then post one
  status line each time a helper reports, so Filip never has to ask for an update. A status line
  about a helper comes from evidence read that turn, its last report time and the files it
  changed, never from memory of what it was sent to do. A helper with no output for 20 minutes is
  reported as stalled in plain words, then restarted.
- Structure first. A "better layout", "restructure" or "organize this page" ask gets one argued
  page structure in words before any code. A redraw of a rejected scene, section or screen is
  proposed in words with one reference, and built only after Filip's yes.
- Notes queue. When Filip sends design notes one after another, or any note while builders run,
  write each to the round's notes file in `clients/<client>/briefs/`, touch no code and no running
  builder, and reply once with the count. Plan them in one pass when he pauses or says go. "Do
  this now" on a note skips the queue.
- Round plan. A plan for a round of fixes asks for the deadline when the thread has none, names
  which live versions each note touches, and puts any default that moves layout on its own
  numbered line. "Go" or "execute everything" approves the rest. A layout line still needs its
  own answer, so ask for it in one line and build the rest meanwhile.
- A pick and the other versions. When Filip picks one version, ask once whether the client will
  see the others. If he says only the pick, the others freeze at their last commit and leave every
  later round unless he names them. Until he answers, they stay live.
- One session per round. A new round or a new task starts a fresh session that reads
  `clients/<client>/tasks.md`, the client rules and the round plan from the repo, with the main
  thread at the effort `foundation/models.md` names. Before a round ends, commit its plan and notes
  so nothing lives only in the old context, and say in one line that the next round starts fresh.
  This needs no handoff document, so the handoff hold stands.
- Environment. Read `foundation/env.md` once per session before the first shot, server restart or
  deploy. Add a line to it the same turn a new trap costs a retry.
- Grill and review. "Grill" plus "review" in one ask runs the grilling skill, when it is
  installed, on the plan, then `/uireview` on the build.
- `/harden` is for words, an answer, a plan, a doc or a drafted message. Run it when Filip types
  it or says harden, poke holes, double check or review this plan, answer or doc. Once per
  target.
- `/uireview` is for UI code only, the screens, prototype, branch or diff. Run it when Filip types
  it or asks to review, QA or grade that UI. Run it once by itself when a UI build or a named
  batch of fixes is finished, before a deploy or a client hand-off. Not after a small fix to one
  named defect unless he asks. Never per edit. It runs one round plus one re-check, then the
  decision card, and Filip chooses.
- Any review loop inside a workflow or a helper chain follows the same rules. One critic round on
  sonnet plus one re-check, pass is no open sev 1, never a 9 of 10 bar. A finding that needs
  Filip's decision goes to him as a question, never to a fixer. No step is auto-reverted.
- Tie breaks. "Review this plan" is `/harden`. "Review the build" or "review the screens" is
  `/uireview`. "Double check", "poke holes" and "check again" are never `/uireview`. They mean
  `/harden` on a plan or answer, and build recipe step 4 on code, plus one line saying `/uireview`
  is there if he wants it.
- On my own UI work, `/uireview` is the review step the operating agreement names, and "Done" in
  the kickoff gate means no open sev 1 on the card, or Filip's ship line.
- No brief on file and no obvious answers gets the kickoff gate from CLAUDE.md, once, in the thread.
- `/mode` is dropped. The mode is automatic and silent. Pick the row in `foundation/models.md`
  from the task, never announce it, and give a model menu hint only when the running model
  differs.

## Build recipe

1. Plan first. Write the plan in a few lines and name the baseline commit before any edit.
2. Spread agents. Split by folder or slice so no two builders touch the same file. Each builder
   works in its own git worktree on its own branch, and the main thread merges on its report.
   Remove the worktrees when the round ends.
3. Spawn helpers by tier, `quick`, `read`, `build` or `deep`, as the session's mode row in
   `foundation/models.md` says. Models and efforts live there and nowhere else, by alias only.
4. Self-check before reporting. Run the build, click the changed flow, read the diff against the
   plan, run `node studio/scripts/baselint.mjs --fix` (review the list, then
   `--fix --apply`) and `node studio/scripts/shoot.mjs --interact`. Fix what fails,
   then report. `/uireview` comes after.
5. Before and after shots of every changed route with
   `node studio/scripts/shoot.mjs`, per the regression rule in CLAUDE.md. Add
   `--interact` when the build has pinned bars, menus, popups or hover states. Interim shots during
   a round cover the changed beats or routes only. The full set is shot once, at round end.
6. Preview link before any ship. Deploy the change to a preview URL Filip can open and click, a
   Vercel preview deployment behind the project's usual password, never production and never
   localhost, and send him that link in chat. Nothing merges to a shared branch, deploys to
   production, or reaches a client until Filip has opened that link and replied with a ship line
   for it. A ship line given before the link does not count, and one link covers one change set.
   This holds for one line fixes too. On Vercel Hobby, deploy with
   `node studio/scripts/deploy.mjs`, per `foundation/env.md`.

Helper reports come back in five lines or fewer, detail in a file. Small edits Filip is watching
live stay in the main thread.

## Guards

Two only. Nothing else blocks, asks or holds a turn.

- Blind find and replace across files is blocked. Enumerate the matches, read each one, then edit.
- A deploy from a repo whose client and linked preview project's client differ in
  `clients/registry.json` asks Filip through the permission prompt. It never denies.

When `hooks/secrets.mjs` is installed it warns once when a prompt holds a pasted key, token or
password, names the kind with a masked form, and advises revoking it. It is a warning and not a
guard. It never blocks and never writes the value anywhere. A pasted secret is never echoed,
copied or written to any file by any agent. Name the kind and at most the last 4 characters, tell
Filip to revoke it, and carry on without it.

## Holds

- Handoffs are on hold until Filip lifts it in his own words. Write no session handoff and no
  delivery handoff, and fill no handoff template. Reading an existing handoff is fine.
- Vercel previews are on hold until Filip lifts it in his own words, to save the Hobby plan's
  deploys. No agent runs `deploy.mjs`, `vercel deploy` or any other preview deploy, and every
  project's `vercel.json` turns off git deploys for `claude/*` branches, per `foundation/env.md`, so
  a push builds nothing. Filip reviews a change on his own localhost, pulled from the session
  branch, with `npm run live` where the project has it. Wherever this file or CLAUDE.md says
  preview link or preview URL, read the pushed commit, named by its short hash in chat. A ship line
  covers that commit and nothing newer. Production still needs his ship line, as before.
- Desktop first. Phone layouts only when the client brief names them. The Widths line in
  `clients/<client>/README.md` counts as the brief for this. `/uireview` and shots use those
  widths, and are desktop only when the line is missing or names no phone width. A phone item in a request with no brief
  naming it is dropped with one line saying so.

## Explore

When Filip says explore, taste log entries may be broken for that ask and each one is named.
Brand values, accessibility and the two guards never break.

## Registry

Look up one client or repo with `node studio/scripts/registry.mjs <client|repo>`.
It prints one line. The file behind it is `clients/registry.json`, which maps a client id to the
folder names that hold its work and its preview project names. Every client lives in the
freelancing repo, so the nearest registered folder above the work wins.

## Lookups, read only when needed

| Need | File |
|---|---|
| Models per role | `foundation/models.md` |
| What good looks like | `foundation/principles.md` |
| Base layout values | `foundation/base-layout.css`, `clients/<client>/base-override.json` |
| Environment traps and deploys | `foundation/env.md` |
| A client's rules and taste log | `clients/<client>/README.md`, `taste.md` |
| A client's tasks | `clients/<client>/tasks.md` |
| A job's brief | `clients/<client>/briefs/` |
| Review findings and cards | `.state/ledger/<task>.json` |
| Tokens per task | `node studio/scripts/tokens.mjs --key <task key>` |
| Defects `/uireview` missed | `.state/review-misses.md` |
