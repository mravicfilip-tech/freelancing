---
name: uireview
description: Reviews UI code in a client or prototype repo. One critic round plus one re-check, every finding in a ledger, ends on a decision card Filip answers with a pasted line. Use when Filip types /uireview, or asks to review, QA or grade the UI, the screens, the prototype, the branch or the diff, and once by itself when a UI build is finished, before a deploy or a client hand-off. Do NOT use for answers, plans, docs or drafts, and not for "double check", "poke holes" or "check again" (those are /harden). Never per edit, never on unchanged code, never in a loop.
---

# Review

One round, one re-check, then Filip decides. The ledger holds the findings and the score.
The rubric is `.claude/skills/uireview/rubric.md`.
Commands are `node studio/scripts/ledger.mjs`, called L below.
Widths come from the Widths line in the client README. With none, 1440 only. A phone width is
checked only when that line names it.

## Start

1. Resolve the client id from the folder the work is in, with `node studio/scripts/registry.mjs
   <folder>`. Every client lives in this one repo, so the repo path is the repo root and the
   client comes from the folder, never from the repo name. Resolve the task key. Use the task key
   from `studio/clients/<client>/tasks.md` (`acme-3`). With no task, use `<client>-` plus the last
   part of the branch name. Say the key in one line. Never ask. If the folder is not a git repo,
   say so and stop.
2. Run `L status <task>`. It decides where to enter.
   - No ledger, or a closed one, goes to Round 1. `L open` starts a fresh ledger.
   - Round 1 recorded and a round left goes to Fix, then Re-check.
   - "card decides" goes straight to Card.
3. A run Filip asked for continues from where the ledger stands. A run started by itself at the
   end of a build starts only when no ledger exists for the key. Otherwise say the review is
   already open or closed, and stop.

## Round 1

1. Run `L open <task> --repo <repo> --client <id>`, adding `--auto` when the run started by
   itself at the end of a build. The flag is never skipped. `L report` lists every run, auto
   against asked.
2. Baseline is the commit or URL Filip named. If none, use the merge base with the default
   branch and say so in one line.
3. Build the diff pack. It is not the whole diff.
   - `git -C <repo> diff --stat <baseline>` and `git -C <repo> status --short`, always. The
     status line lists new files, which the diff does not show.
   - Hunks, from `git -C <repo> diff -U1 <baseline> -- <paths>`, for the files the ask names
     and for every stylesheet, token, layout and shared component file in the stat. A changed
     rule in those reaches routes outside the ask.
   - Everything else stays stat only. The critic reads it from disk when it needs it.
   - Leave out lock files, generated files, images and snapshots.
   - The pack holds at most 60,000 characters, about 15k tokens. Over that, send modified files
     before new ones and name the files left out.
4. Shots. When a route is known, run `node studio/scripts/shoot.mjs
   --url <base url or folder> --routes "name=/path,..." --out <shots>/after --compare <shots>/before
   --widths <the client's Widths line>` with `<shots>` at `studio/.state/shots/<task>`. The base
   URL and the start command are in the client README under Run. With no before shots, skip
   `--compare` and tell the critic. With no route named, use the routes the changed page files
   map to. If none can be found or the app will not start, skip shots and tell
   the critic the review is diff only. When shoot.mjs says puppeteer-core or Chrome is missing,
   say so in one line and continue diff only.
5. Spawn exactly one subagent. Type general-purpose, model sonnet. Give it only
   - the rubric path, read in full
   - from `studio/clients/<client>/README.md`, only the sections Brand, Rules that never bend,
     Accessibility and Widths, plus Reference when a live reference is named, and `studio/clients/<client>/taste.md`
     in full, since its entries are the rules
   - the diff pack, the repo path, the ask in one line
   - the shots folder, with `report.json` first. It opens an image only for a route that has a
     diff or a failed check, at most 8 images
   - the cap, below
   - the instruction to return findings as JSON lines and nothing else, never the builder's
     reasoning and never a score

   Do not send foundation files or DOCTRINE.md. The rubric is the whole brief.
   When the client has no folder under `studio/clients/` (a personal tool, a new pursuit), tell the
   critic to skip the brand and taste checks, and that accessibility findings cap at sev 2.
6. For each line run `L add <task> --sev <n> --where "<where>" --what "<what>"`. A line with
   `{"none":true}` adds nothing. A line with `"cap":true` adds nothing, see Cap.
7. Run `L round <task>`.

## Cap

A round 1 critic stops at about 90k tokens or 30 tool calls, whichever comes first. A re-check
critic stops at about 30k tokens or 12 tool calls. At the cap it returns the findings it has,
then one last line `{"cap":true,"unchecked":"<routes or sections not done>"}`, and stops. It never
restarts and never asks to continue.

The main thread never spawns a second critic to finish a capped one, and never respawns one
over a badly formatted answer. It adds the lines it can read. When a run hit its cap, it shows
one line under the card, `Not checked, critic hit its cap, <unchecked>`. Filip decides whether
the card is enough.

## Fix

The main thread fixes the findings, starting with sev 1. Fix sev 1 and sev 2. Fix a sev 3 only
when it sits in a line already being changed. Touch only what a finding names.
A sev 1 marked `unverified` gets a before and after shot of its route first. If the shot
clears it, mark it `fixed` with "cleared by shot" in your report. If not, fix it.
Mark each result with `L mark <task> <id> fixed|partly|open`. Never set `accepted`, only
Filip's words do that, through the card.

## Re-check

1. Run `L status <task>`. If it says the card decides, run `L card <task>`, show it and stop.
2. Find the diff since the last round. The tree is the last entry in `rounds` of
   `studio/.state/ledger/<task>.json`. Run `git -C <repo> diff <tree>` and
   `git -C <repo> status --short`. If the diff is empty, or no finding is open, skip the critic.
   The code has not changed, so go to Card. Reviewing unchanged code is the loop this skill
   exists to prevent.
3. Spawn one subagent, general-purpose, sonnet. Send it only the open list from `L card`, the new
   diff, the repo path, the re-check cap, and the rubric's Re-check mode section. It does not
   get the full ask, the full diff, the brand files or the rest of the rubric.
4. It returns a status per id, plus new findings at sev 1 only. Apply the statuses with
   `L mark`. Add each new sev 1 with `L add`. The ledger refuses sev 2 and sev 3 here.
5. Run `L round <task>` to record the result.

## Card

Run `L card <task>` and show its output exactly. Then stop. Do not fix, re-run or choose
for Filip, and never start another round on your own.

When Filip pastes a line, run `L choose <task> "<his line>"`. Free words that are not one of
the card's lines, such as "looks fine, ship it", are not a choice. Offer the matching line and wait.
- `ship` is recorded only with no open sev 1, or with his `waiving` line. The ledger
  refuses anything else, so show him the refusal.
- `fix` grants exactly one more re-check. Fix the listed ids, then run the Re-check section
  once, then show the card again.
- `drop` closes the ledger.

The ledger checks that the line is Filip's. `L card` stamps the time it printed, and `choose` and
`mark ... accepted` look in the Claude Code transcripts for a message he typed after that stamp that
holds the line. One message authorises one choice. If the ledger says "Not recorded", show him the
card again and wait for him to paste the line. There is no way round it, so do not try another way.

After a ship, move the task in `studio/clients/<client>/tasks.md` to Review or Done as Filip says.
With no task, skip this and say so. After a drop, tell him the branch is untouched.

## After the card

When Filip later reports a defect on a shipped task and a rubric check names it, append one line
to `studio/.state/review-misses.md`, creating it if needed, with the date, the task, the
defect and the rubric section that should have caught it. Do not open a new review for it.

## Rules

- The score is shown, never the bar. Pass means no open sev 1.
- Same tree as the last round records nothing. Say the code has not changed.
- Text Filip reads follows `studio/foundation/writing.md`.
