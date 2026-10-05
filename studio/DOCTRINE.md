# Studio doctrine

The light kit. It helps and never polices. Root is `studio/` in this repo, and every path in this
file is relative to it unless it starts with `studio/` or `.claude/`. Commands run from the repo
root. The root CLAUDE.md owns the operating agreement, the kickoff gate, scope discipline and the
regression rule. This file adds to them and does not repeat them.

## Load

@foundation/writing.md

Writing rules load once through the pointer above. Never inline or restate them.

## Triggers

Each trigger fires on its own event and no other. None fires every turn or every edit.

- Before UI work in a client's folder, read `clients/<client>/README.md` and `clients/<client>/taste.md`
  once per session. Skip the read if both are already in context.
- Keep `clients/<client>/tasks.md` current, and never ask permission to do it. When Filip hands
  over work, add a task under Backlog, or under In progress when it starts at once, titled the way
  he would say it out loud. Move the task between Backlog, In progress, Review and Done as its
  state changes. Add steps as the shape of the work becomes clear, and tick each step the moment
  the conversation shows it done. Ticking a step never moves the task. Steps never appear in
  anything Filip sends a client, a status note, an invoice line or a summary. Those read at task
  level. A session whose work maps to no task gets one added. A client with no folder yet gets one
  made with `node studio/scripts/registry.mjs add <id>`.
- `/taste`. The turn Filip picks, rejects, accepts, kills a direction or sets an app-wide ruling,
  run it. It writes the client `taste.md`. A preference that applies beyond one client goes in
  `foundation/principles.md`, never a project memory.
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
  `/uireview`. "Double check", "poke holes" and "check again" are never `/uireview`. On a plan or an
  answer they mean `/harden`. On code or a build they mean build recipe step 4, with one line
  saying `/uireview` is there if he wants it.
- On my own UI work, `/uireview` is the review step the operating agreement names, and "Done" in
  the kickoff gate means no open sev 1 on the card, or Filip's ship line.
- No brief on file and no obvious answers gets the kickoff gate from CLAUDE.md, once, in the thread.
- `/mode <name>` sets the session's mode. With no `/mode`, pick the mode from the first real task
  and say it in one line, once. A model menu hint only when the running model differs.

## Build recipe

1. Plan first. Write the plan in a few lines and name the baseline commit before any edit.
2. Spread agents. Split by folder or slice so no two builders touch the same file.
3. Spawn helpers by tier, `quick`, `read`, `build` or `deep`, as the session's mode row in
   `foundation/models.md` says. Models and efforts live there and nowhere else, by alias only.
4. Self-check before reporting. Run the build, click the changed flow, and read the diff against
   the plan. Fix what fails, then report.
5. Before and after shots of every changed route with `node studio/scripts/shoot.mjs`,
   per the regression rule in CLAUDE.md.

Helper reports come back in five lines or fewer, detail in a file. Small edits Filip is watching
live stay in the main thread.

## Guards

Two only. Nothing else blocks, asks or holds a turn.

- Blind find and replace across files is blocked. Enumerate the matches, read each one, then edit.
- A deploy from a repo whose client and linked preview project's client differ in
  `clients/registry.json` asks Filip through the permission prompt. It never denies.

## Holds

- Handoffs are on hold until Filip lifts it in his own words. Write no session handoff and no
  delivery handoff, and fill no handoff template. Reading an existing handoff is fine.
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
folder names that hold its work and its preview project names. Every client lives in this repo, so
the nearest registered folder above the work wins.

## Lookups, read only when needed

| Need | File |
|---|---|
| Models per role | `foundation/models.md` |
| What good looks like | `foundation/principles.md` |
| A client's rules and taste log | `clients/<client>/README.md`, `taste.md` |
| A client's tasks | `clients/<client>/tasks.md` |
| A job's brief | `clients/<client>/briefs/` |
| Review findings and cards | `.state/ledger/<task>.json` |
| Tokens per task | `node studio/scripts/tokens.mjs --key <task key>` |
| Defects `/uireview` missed | `.state/review-misses.md` |
