---
name: newui
description: Starts a new UI the way Filip wants it, references first, one argued direction, the hardest screen built on a proven component base, every state from day one, and the kit and golden screens born from screen one. Use when Filip types /newui, asks for a new screen, a new app, a new prototype or a redesign, and by itself when a new UI or a new client app starts with no clients/<client>/kit/. Do NOT use for a fix to a named defect, a copy edit, a single control swap in a finished screen, or a static document or deck.
---

# New UI

K is the kit root. It is `studio/` when the repo root holds `studio/DOCTRINE.md`, and the folder
this skill was loaded from otherwise.

A new UI built from a guess gets rejected. This skill replaces the guess with references, one
direction Filip picks, and a kit that every later screen reuses. Desktop first. Phone layouts only when the client brief names them.
Text Filip reads follows `K/foundation/writing.md`.

## Before step 1

1. Read `K/clients/<client>/README.md` and `taste.md` once. With no client folder, say so and carry on.
2. Run `node K/scripts/kit.mjs list --client <id>`. A client with a kit skips to step 3 and builds
   only from it. A client with none gets the full run.
3. When the brief has the client's acceptance criteria, keep them in the plan. If `K/clients/<client>/glossary.md` is missing, copy it from
   `K/clients/_template/glossary.md`.
4. Ask the kickoff gate from CLAUDE.md only for what the repo and thread do not already answer.

## Steps

### 1. References

- Name 3 to 5 real products that do this job well, with the one thing each does best. Say why
  each fits this client's users and data, not why it is popular.
- Add the brand README, since it overrules every reference on palette, type and logo.
- End with a short list of patterns to borrow, one line each, for example "dense table with a
  pinned header, from Linear" and "inline row actions on hover and focus, from Stripe".
- Name the patterns to refuse as well, one line each.

### 2. Hardest screen and one direction

- Pick the screen that carries the most risk. The densest data, the longest form, the most states,
  the one the client will judge the app by. Say in one line why it is the hardest.
- Write one direction in words. Layout, hierarchy, the primary action, how the data is shown, and
  what it refuses. One direction, argued, never a menu.
- **Stop.** Filip picks or corrects. Build nothing until he does.

### 3. Proven base

- Start on a mature primitive library, Radix or shadcn, themed through
  `K/foundation/tailwind-preset.cjs` or `K/foundation/base-layout.css` mapped to the brand tokens.
- Never hand roll a menu, dialog, select, popover, tabs, tooltip or combobox. Keyboard and focus
  behaviour come from the primitive.
- Map the brand tokens first. Palette, type, radius and control heights go in once, then screens
  use tokens only. A value outside the preset is a defect, not a choice.
- Reuse every item in `kit.mjs list` before writing a new component.

### 4. Real content and every state

- Use real content. Real names, real lengths, real counts from the repo data or the brief. No
  lorem ipsum and no five perfect rows.
- Build these states for the hardest screen from the start, empty, loading, error with a next
  step, long text that wraps or truncates with a tooltip, no access, and a very large list.
- Use the words in `K/clients/<client>/glossary.md`. Add a term the first time the UI invents one.
- Cover every acceptance criterion in the brief and tick each in the plan.

### 5. Build only that screen

- Build the one screen in the real app, on the session branch, per the operating agreement. Name
  the concept in the task line with its PR and preview link.
- Self-check per build recipe step 4, `baselint --fix` then `shoot.mjs --interact`, desktop only.
- Show it to Filip with a preview link. **Stop.** Filip accepts, corrects or rejects.

### 6. The kit and the golden screen are born here

The same turn Filip accepts something, record it.

- Each control and card he accepts gets `node K/scripts/kit.mjs add --client <id> ...`.
- The accepted screen gets `node K/scripts/golden.mjs add --client <id> ...`.
- Run `/taste` for the pick as usual. A rejected direction is logged REJECTED with the treatment named.
- Only then plan screen two. Later screens are built from the kit and checked with
  `golden.mjs compare`, so they match screen one without a new round of taste picks.

## Rules

- Two stops only, the direction and screen one. Between them, work without asking.
- One screen first. Never build the whole app to see how it lands.
- Micro detail (motion, icons, states, loaders) goes to `variants.mjs` as 3 to 5 numbered
  variants on one board, never as separate links.
- Brand values come from the README tokens, never an improvised hex.
- Finish with `/uireview` once, per DOCTRINE.md, before any hand-off.
