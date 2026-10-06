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

## Modes

`/mode <name>` picks one row for the session. With no `/mode`, pick the row from the task and say
it in one line, once.

| Mode | Main thread | Builders | Readers, research | Shots, maps, sweeps | Use for |
|---|---|---|---|---|---|
| coding | opus, high | build | read | quick | Features, fixes, scripts, tooling |
| studio | opus, high | build | read | quick | UI prototypes and client builds. Director on fable when asked |
| content | opus, medium | none | read | quick | Reports, emails, docs, decks, status notes |
| research | sonnet, medium | none | read | quick | Reading, analysis, transcripts, web research |
| light | sonnet, low | quick | quick | quick | Small lookups, one-line edits, status checks |

`deep` is for a judgement call Filip asks a helper to make, in any mode.

## Rules

- A session cannot switch its own model or effort. When the mode's main thread differs from the
  running model, say once which model and effort to pick in the model menu. Otherwise say nothing.
- The `/uireview` critic is not set by the mode. It stays one sonnet helper with its own caps.
- Filip can override any seat. An override lasts for the session.
- Caches are per model. Judge cost per finished job with `node scripts/tokens.mjs`, not per call.
