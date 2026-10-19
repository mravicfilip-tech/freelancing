# Studio kit

A personal kit for Claude Code. It gives every session the same writing rules, a way to start and
review UI before a client sees it, a task list per client, a shared base layout, and small guards.
It helps and never polices. It needs Node 18 or newer.

It lives inside this repo so every cloud session loads it with nothing to install. Every client
lives in this repo too, each in its own folder, with Remittix at the root for now.

## What is in it

- `CLAUDE.md` at the repo root, the operating agreement. It loads `studio/DOCTRINE.md`, the
  triggers, which loads `studio/foundation/writing.md`.
- `.claude/skills/` with `/newui`, `/story`, `/uireview`, `/design`, `/harden` and `/taste`. The other skills
  in that folder are Figma and frontend-design, not part of the kit. There is no `/mode`. The model
  row is picked from the task and never announced.
- `.claude/agents/` with five helper tiers, `quick`, `read`, `build`, `deep` and `critic`.
- `.claude/settings.json`, which runs `studio/hooks/guard.mjs` and `studio/hooks/secrets.mjs`. The
  guard blocks a blind find and replace and asks before a deploy to the wrong client's preview
  project. The secrets hook only warns when a prompt holds a pasted key or token.
- `studio/foundation/base-layout.css`, one type, spacing, radius, control, icon, shadow and z-index
  scale, with `tailwind-preset.cjs` for the same scale in Tailwind.
- `studio/scripts/` with the review ledger and pack, the base layout lint, screenshots with an
  interaction pass, the component kit, golden screens, the variant board, the task walkthrough, the
  design board, the deploy script for Vercel Hobby, the token report and the client registry.
- `studio/foundation/env.md`, the traps the cloud container and Vercel have set, read before the
  first shot, server restart or deploy.
- `studio/foundation/variant-switcher.tsx`, the floating bar every set of variants carries, copied
  into the app and mounted once at the root. Base and numbered variants, `[` and `]` to step, a
  digit to jump, hidden for automated browsers.
- `studio/clients/` with a template, `registry.json` and one folder per client. The template holds
  `glossary.md`, `base-override.json`, `flows/` and empty `kit/` and `golden/` folders.

## Everywhere you work

- **Cloud sessions on any repo, new ones by default.** In the cloud environment settings, put this
  line in the setup script once. Every new session in that environment then clones the latest kit
  and installs the rules, guards, helpers, skills and screenshot tools for the user, so each kit
  update reaches new chats with nothing to redo.

  ```
  git clone --depth 1 https://github.com/mravicfilip-tech/freelancing /tmp/studio-kit && node /tmp/studio-kit/studio/install.mjs --cloud --skills --deps || true
  ```

  Inside this repo it installs nothing but the screenshot tools, since the repo carries the kit.
  If it runs from another folder, nothing loads twice. This repo's `.claude/settings.json` leaves
  out the home copy of the rules, and the home copy of each hook stays quiet when the repo has its
  own. `|| true` keeps a failed clone from stopping the session.
- **Every claude.ai chat and Cowork.** Run `node studio/scripts/account-skills.mjs`, then upload
  each zip in `studio/dist/` in Claude settings under Capabilities, Skills, replacing any older
  copy. Paste `studio/chat/preferences.md` into Settings, Profile, under personal preferences.
  These two need a new upload after each kit update.
- **Claude Code on your own machine.** From a clone of this repo run
  `node studio/install.mjs --skills --deps`. Remove it with `node studio/install.mjs --uninstall`.

## Cloud sessions

- Each session gets a fresh container. What is not committed is gone when it is reclaimed.
- Taste logs, task lists, brand files, glossaries, kits, golden screens and review ledgers live in
  `studio/` and get committed. Shots, packs and boards stay in `studio/.state/` and are not.
- Sessions run on a `claude/<name>` branch. The concept name, the PR and the preview URL go in the
  task line in `studio/clients/<client>/tasks.md`. The default branch holds accepted work only.
- Screenshots need puppeteer-core. The setup script installs it. Without it, run
  `npm ci --prefix studio` once per session before the first shot. The scripts find the cloud
  browser at `/opt/pw-browsers/chromium` by themselves. Elsewhere, set `CHROME_PATH` if Chrome or
  Edge is somewhere unusual.

## Commands

- `/newui` starts a new UI. References, one argued direction, the hardest screen on a proven
  component base, every state, then the kit and golden screens from screen one. It stops twice.
- `/uireview` reviews UI code. One critic round, one re-check, then a decision card that Filip
  answers by pasting a line. Pass means no open severity 1 finding.
- `/design` lays every screen of a project out on one board at 1920 wide. It runs by itself when a
  project has more than 5 screens, before the preview link goes out.
- `/story` settles a scroll story, hero sequence or 3D walk through in tables before anything is
  built, then builds one beat in one version.
- `/harden` pokes holes in words, meaning an answer, a plan, a doc or a drafted message.
- `/taste` logs a design pick or rejection to the client's `taste.md` the turn it happens. "Rule it
  app wide" runs its app-wide flow.

## Add a client

```
node studio/scripts/registry.mjs add acme --repo acme --project acme-web
```

`--repo` takes the folder in this repo that holds the client's code, and `--project` the preview
project names. This adds the client to `studio/clients/registry.json` and makes
`studio/clients/acme/` from the template with `README.md` for brand rules, `taste.md`, `tasks.md`
and `base-override.json`. Fill in the README, including Widths and Run. Copy `glossary.md` from the
template the first time the UI needs a term. Look a client up with
`node studio/scripts/registry.mjs acme`.

## Base layout

`studio/foundation/base-layout.css` is the shared scale, named `--bl-*`, for type size, line
height, spacing, radius, control height, icon size, shadow, z-index and the desktop shell. A client
repo maps its own brand tokens onto those names. A client that needs a different number keeps it in
`studio/clients/<client>/base-override.json`, which starts as `{}`. The known keys are `fontFloor`,
`fontSizes`, `lineHeights`, `spacing`, `radius`, `controlHeights`, `iconSizes`, `iconStroke`,
`zIndex` and `shadowColor`, plus a `source` line saying where the value came from.

```
node studio/scripts/baselint.mjs --repo <repo> --base <ref> --client acme
```

It reads `git diff` and checks added lines only, so old code is never reported. It warns and always
exits 0. Saying "rule it app wide" about a value writes it to the override and lists every place in
the repo it applies, before anything is changed.

## Interaction pass

```
node studio/scripts/shoot.mjs --url <base> --routes "home=/" --out <dir> --interact
```

Add `--interact` when a page has a pinned bar, a menu, a popup or hover states. It scrolls, hovers
and clicks after the screenshot, and reports sticky layers that are translucent or painted over,
popups that sit under a header or get clipped, hover states that shift the layout, and z-index
values off the scale. Each finding carries a suggested severity from 1 to 3. It adds roughly 10 to
20 seconds per route and width.

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

## Tests

```
node studio/scripts/lint.mjs
npm test --prefix studio
npm run test:browser --prefix studio
```

The browser tests need puppeteer-core, from `npm ci --prefix studio`, and a Chrome, Chromium or
Edge.
