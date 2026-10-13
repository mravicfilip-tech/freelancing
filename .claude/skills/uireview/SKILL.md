---
name: uireview
description: Reviews UI code in a client or prototype repo. One critic round plus one re-check, every finding in a ledger, ends on a decision card Filip answers with a pasted line. Use when Filip types /uireview, or asks to review, QA or grade the UI, the screens, the prototype, the branch or the diff, and once by itself when a UI build is finished, before a deploy or a client hand-off. Do NOT use for answers, plans, docs or drafts, and not for "double check", "poke holes" or "check again" (those are /harden). Never per edit, never on unchanged code, never in a loop.
---

# Review

K is the kit root. It is `studio/` when the repo root holds `studio/DOCTRINE.md`, else
`~/.claude/studio` when that holds `DOCTRINE.md`, else the folder this skill was loaded from.
S is where review state lives, `K/.state` when K holds `DOCTRINE.md` and
`~/.claude/studio-state` otherwise.

One round, one re-check, then Filip decides. The ledger holds the findings and the score.
The rubric is `rubric.md`, next to this file.
Commands are `node K/scripts/ledger.mjs`, called L below.
Widths come from the Widths line in the client README. With none, 1440 only. A phone width is
checked only when that line names it.

## Start

1. Resolve the client id from the folder the work is in, with `node K/scripts/registry.mjs
   <folder>`. Every client lives in the freelancing repo, so the repo path is the repo root and the
   client comes from the folder, never from the repo name. With no match, the client is none.
   Resolve the task key. Use the task key from `K/clients/<client>/tasks.md` (`acme-3`). With no
   task, use `<client>-` plus the last part of the branch name, or the repo folder name with no
   client. Say the key in one line. Never ask. If the folder is not a git repo, say so and stop.
2. Run `L status <task>`. It decides where to enter.
   - No ledger, or a closed one, goes to Round 1. `L open` starts a fresh ledger.
   - Round 1 recorded and a round left goes to Fix, then Re-check.
   - "card decides" goes straight to Card.
3. A run Filip asked for continues from where the ledger stands. A run started by itself at the
   end of a build starts only when no ledger exists for the key. Otherwise say the review is
   already open or closed, and stop.

## Round 1

1. Run `L open <task> --repo <repo> --client <id>`, adding `--auto` when the run started by
   itself at the end of a build. The flag is never skipped. `L report` lists every run, auto against asked.
2. Baseline is the commit or URL Filip named. If none, use the merge base with the default
   branch and say so in one line.
3. Shots. When a route is known, run `node K/scripts/shoot.mjs
   --url <base url or folder> --routes "name=/path,..." --out <shots>/after --compare <shots>/before
   --widths <the client's Widths line>` with `<shots>` at `S/shots/<task>`. The base URL and the
   start command are in the client README under Run. With no before
   shots, skip `--compare` and tell the critic. With no route named, use the routes the changed
   page files map to. If none can be found or the app will not start, skip shots and tell the
   critic the review is diff only. Add `--interact` whenever the build has a pinned bar, a menu,
   a popup or hover states, which is almost always. It adds 10 to 20 seconds per route and width.
4. Walk and criteria, before the pack. Name the 2 or 3 jobs the screen is for, one line each. Each
   needs `K/clients/<client>/flows/<job>.json`. Create a missing one from
   `K/clients/_template/flows/example.json`. When the brief has the client's acceptance criteria, keep them as a numbered list for the spawn message.
5. Build the pack with one command. The main thread never assembles it by hand and never pastes
   its parts into the spawn message.
   `node K/scripts/pack.mjs --task <key> --repo <repo> --base <baseline> --client <id> --shots <shots dir> --surface "<words for the screens in scope>"`
   It writes `pack.md` and `contact.png` and prints their paths. `pack.md` is compact, under about
   15k tokens, and holds the diff pack (stat, status line, hunks for the ask and for every
   stylesheet, token, layout and shared component file), the base layout results, compact shot,
   interact and hierarchy summaries, the golden and kit results, the walk summaries, and only the
   taste entries for that surface plus the app-wide ones. `contact.png` is one sheet of all the
   after shots. Never run baselint, golden, kit, walk or the taste read a second time by hand.
   If the command fails, say so in one line and stop, since a hand built pack is the cost this
   step exists to remove.
6. Spawn exactly one subagent. Type `critic`, which is sonnet at high effort with Read, Grep, Glob
   and Bash only. Give it only
   - the rubric path, read in full
   - the `pack.md` path, read in full, and the `contact.png` path, opened first. It may open at
     most 2 more images, only for a route that has a finding
   - the repo path, the ask in one line, and the acceptance criteria list when there is one. It grades
     rubric section 6 from the base layout block, sections 8 to 11 from the hierarchy summary,
     the walk summaries, the golden and kit results and the criteria, and checks
     `K/clients/<client>/glossary.md` for copy
   - from `K/clients/<client>/README.md`, only the sections Brand, Rules that never bend,
     Accessibility and Widths, plus Reference when a live reference is named
   - the cap, below
   - the instruction to return findings as JSON lines and nothing else, never the builder's
     reasoning and never a score

   Do not send foundation files, DOCTRINE.md or the whole taste log. The rubric and the pack are
   the whole brief. When the client has no folder under `clients/` (a personal tool, a new pursuit), tell
   the critic to skip the brand and taste checks, and that accessibility findings cap at sev 2.
7. For each line run `L add <task> --sev <n> --where "<where>" --what "<what>"`. A line with
   `{"none":true}` adds nothing. A line with `"cap":true` adds nothing, see Cap.
8. Run `L round <task>`.

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
   `S/ledger/<task>.json`. Run `git -C <repo> diff <tree>` and
   `git -C <repo> status --short`. If the diff is empty, or no finding is open, skip the critic.
   The code has not changed, so go to Card. Reviewing unchanged code is the loop this skill
   exists to prevent.
3. Spawn one subagent, type `critic`. Send it only the open list from `L card`, the new diff,
   the repo path, the re-check cap, and the rubric's Re-check mode section. It does not get the
   full ask, the full diff, the pack, the brand files or the rest of the rubric.
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

After a ship, move the task in `K/clients/<client>/tasks.md` to Review or Done as Filip says. With no task, skip this and say so. After a drop, tell him the branch is untouched.

## After the card

When Filip later reports a defect on a shipped task and a rubric check names it, append one line
to `S/review-misses.md`, creating it if needed, with the date, the task, the defect
and the rubric section that should have caught it. Do not open a new review for it.

## Rules

- The score is shown, never the bar. Pass means no open sev 1.
- Same tree as the last round records nothing. Say the code has not changed.
- Text Filip reads follows `K/foundation/writing.md`.
