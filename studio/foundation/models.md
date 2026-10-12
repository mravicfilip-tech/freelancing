# Models

The one place models are named. Families only, never a version id and never a price. Claude Code
resolves each alias to the newest model in its family, so a new version needs no edit here. A new
family needs one line in Families. Lint fails on a pinned version id in any live studio file.

## Families

| Alias | Use |
|---|---|
| opus | Judgement, planning, the main thread on real work |
| sonnet | Building, reading, research, the `/uireview` critic |
| haiku | Screenshots, repo maps, sweeps. It ignores effort |
| fable | A hard creative call only, said in one line |

## Helper tiers

Agent files in `.claude/agents/` at the repo root. Spawn helpers by tier, never by a
loose model name, so effort is always set.

| Tier | Alias | Effort |
|---|---|---|
| quick | haiku | low |
| read | sonnet | medium |
| build | sonnet | high |
| deep | opus | high |
| critic | sonnet | high |

## Modes

The mode is automatic and silent. `/mode` was dropped on 12 Oct 2026. Pick the row from the task,
never announce it, and let a new kind of task change the row without a word.

| Mode | Main thread | Builders | Readers, research | Shots, maps, sweeps | Use for |
|---|---|---|---|---|---|
| coding | opus, high | build | read | quick | Features, fixes, scripts, tooling |
| studio | opus, high | build | read | quick | UI prototypes and client builds |
| content | opus, medium | none | read | quick | Reports, emails, docs, decks, status notes |
| research | sonnet, medium | none | read | quick | Reading, analysis, transcripts, web research |
| light | sonnet, low | quick | quick | quick | Small lookups, one-line edits, status checks |

`deep` is for a judgement call Filip asks a helper to make, in any mode.

## Rules

- A session cannot switch its own model or effort. Give a model menu hint only when the running
  model differs from the mode's main thread, once, naming the model and effort to pick. Otherwise
  say nothing.
- The `/uireview` critic is not set by the mode. It is the `critic` tier, one sonnet helper with its own caps and a tools line of Read, Grep, Glob and Bash.
- Every tier file sets a `tools` line, the smallest set that does the job. A helper with no tools line loads every tool schema and connector name and starts near 80k to 90k tokens, against about 21k with one.
- Filip can override any seat. An override lasts for the session.
- Caches are per model. Judge cost per finished job with `node scripts/tokens.mjs`, not per call.
