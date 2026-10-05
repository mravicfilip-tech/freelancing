# Studio kit

A personal kit for Claude Code. It gives every session the same writing rules, a way to review UI
before a client sees it, a task list per client, and two small guards. It helps and never polices.
It needs Node 18 or newer.

It lives inside this repo so every cloud session loads it with nothing to install. Every client
lives in this repo too, each in its own folder, with Remittix at the root for now.

## What is in it

- `CLAUDE.md` at the repo root, the operating agreement. It loads `studio/DOCTRINE.md`, the
  triggers, which loads `studio/foundation/writing.md`.
- `.claude/skills/` with `/uireview`, `/harden`, `/taste` and `/mode`. The other skills in that
  folder are Figma and frontend-design, not part of the kit.
- `.claude/agents/` with four helper tiers, `quick`, `read`, `build` and `deep`.
- `.claude/settings.json`, which runs `studio/hooks/guard.mjs`. It blocks a blind find and replace
  and asks before a deploy to the wrong client's preview project.
- `studio/scripts/` with the review ledger, the token report, the client registry and screenshots.
- `studio/clients/` with a template, `registry.json` and one folder per client.

## Cloud sessions

- Each session gets a fresh container. What is not committed is gone when it is reclaimed.
- Taste logs, task lists, brand files and review ledgers live in `studio/` and get committed.
  Shots stay in `studio/.state/shots/` and are not committed.
- Sessions run on a `claude/<name>` branch. The concept name, the PR and the preview URL go in the
  task line in `studio/clients/<client>/tasks.md`. `main` holds accepted work only.
- Shots use the browser at `/opt/pw-browsers/chromium` and the client's own `playwright-core`.
  Run the client's `npm ci` first. Elsewhere, `npm i puppeteer-core` in `studio/` and set
  `CHROME_PATH` if the browser is somewhere unusual.

## Commands

- `/uireview` reviews UI code. One critic round, one re-check, then a decision card that Filip
  answers by pasting a line. Pass means no open severity 1 finding.
- `/harden` pokes holes in words, meaning an answer, a plan, a doc or a drafted message.
- `/taste` logs a design pick or rejection to the client's `taste.md` the turn it happens.
- `/mode <name>` picks coding, studio, content, research or light for the session.

## Add a client

```
node studio/scripts/registry.mjs add acme --repo acme --project acme-web
```

`--repo` takes the folder in this repo that holds the client's code, and `--project` the preview
project names. This adds the client to `studio/clients/registry.json` and makes
`studio/clients/acme/` from the template with `README.md` for brand rules, `taste.md` and
`tasks.md`. Fill in the README, including Widths and Run. The guard maps a folder to a client by
the nearest registered folder name above it. Look a client up with
`node studio/scripts/registry.mjs acme`.

## Read the token report

```
node studio/scripts/tokens.mjs --key acme-3
```

It reads the Claude Code transcripts and prints one row per session, with main thread and helpers
apart, and a total. Filter with `--since 2026-10-01`, `--cwd <folder text>` or `--key <task key>`.
In the cloud it sees only the sessions this container ran.

- `input` and `output` are the tokens sent and written.
- `cache read` is context reused cheaply, and `cache write` is context stored for reuse.
- `helpers` rows are the subagents. A high helper share means the review or the build fanned out.
- Judge cost per finished job, not per call, since caches are per model.

## Local use

The same guard can run outside this repo. `node studio/hooks/wire.mjs add <settings.json> <path to
studio>` adds it to a Claude Code settings file, and `remove` takes it out again.

## Tests

```
node studio/scripts/lint.mjs
node studio/scripts/test/ledger.test.mjs
node studio/hooks/test/guard.test.mjs
```
