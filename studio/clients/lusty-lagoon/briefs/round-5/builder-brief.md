# Round 5 builder brief, lusty-lagoon

You build one of five design directions for the Lusty Lagoon dashboard, from zero, in one folder,
`lusty-lagoon/src/features/variants/v<N>/`. Filip rejected round 4 as not 2026 enough and asked for
"drastic" differences and "way way better options". He offered the effort. Use it.

## Read first, all of it

1. `studio/clients/lusty-lagoon/briefs/round-5/consolidated.md`, end to end. Section 5 is your
   direction. Section 3 is every rule that still binds.
2. Open with the Read tool every seed reference your direction names, at full size, and study them
   until you can describe their craft in numbers. All of `references/2026-10-19-round-5/`, then the
   ones from older sets your row names.
3. Your variant today, the before shots `v<N>_1440.png` and `v<N>_1920.png` in
   `<main checkout>/studio/.state/shots/lusty-lagoon-r4-after/` (variant 2 has none, it is new).
4. The code in your folder, the kit in `features/variants/kit/` (read only), the shared data in
   `features/variants/shared/data.ts`, `data/games.ts` and `features/wallet/store.tsx`.

## Setup

- First command in your worktree, `git checkout -B r5-v<N> <base sha from your prompt>`. Your prompt
  names the main checkout too.
- Symlink installs, never install. `ln -s <main checkout>/lusty-lagoon/node_modules lusty-lagoon/node_modules`
  and `ln -s <main checkout>/studio/node_modules studio/node_modules`.
- `npm run build` in `lusty-lagoon/`, then `npx vite preview --port <your port> --strictPort` in the
  background. Free a port with `fuser -k <port>/tcp`, never `pkill -f`.
- Shots, `node /tmp/claude-0/-home-user-freelancing/76496740-33b7-5e16-a5ef-af5406e9e2dd/scratchpad/tools/snap.mjs "<url>?still" <out.png> <width> 900 [--full]`.
  Side by side boards, `python3 .../scratchpad/tools/board.py` (read its header) or PIL.
- The Tailwind preset replaces the scales. Spacing keys 0 0.5 1 2 3 4 6 8 12 16 24, heights 4 5 6 8 9
  10 11, text 12 14 16 18 20 24 28 32 40 48. Anything else silently does nothing, so write arbitrary
  values (`h-[48px]`, `text-[64px]`). Check with `.../scratchpad/tools/scalecheck.py <files>`.

## What you own and what you do not

- You own your folder. Delete, rename and rewrite anything in it. Variant 2 replaces the placeholder.
- You never edit the kit, shared data, App.tsx, variants.ts or anything outside your folder. Build
  any visual part you need inside your folder, a copy of a kit part restyled is fine as long as the
  behaviour stays (the balance menu, the wallet links, the game dialog).
- Buttons are `KitButton tone="primary"` (the orange key) with the `shape` your direction uses,
  `tone="purple"` for the secondary key. Never a flat primary. If your direction needs a key shape the
  kit lacks, build it in your folder with the same recipe (kit.css `.k-key`).

## How to work

1. Direction sheet first. Before code, write in your report file the ground and surface colours, the
   edge and light recipe, the shape language and radii, the type ramp (seven sizes at most), the key
   shape, the nav active treatment, the art plan with source sizes, the motion, and the eye order.
   Every value traced to a seed reference or to `consolidated.md`.
2. Build the whole page from zero to that sheet. Real data, every control working, every state.
3. Then at least three passes of this loop, more if the gap list is not empty.
   - Shoot 1440 and 1920 full page, plus the first fold at 1440.
   - Lay your fold beside your main seed reference at the same scale and look hard.
   - Write the five biggest gaps a senior casino designer would name, specific and measurable.
   - Fix them. Re-shoot.
   Stop only when no gap on the list is something a designer would call cheap, flat, generic, cut
   off, cramped or dated. Keep each pass's gap list in your report file.
4. Hover the tiles, covers, the key and the nav, open the balance menu, run `?state=loading`, `empty`
   and `error`, and look at each shot.

## Rules that never bend

Everything in `consolidated.md` sections 2, 3 and 6, plus these.
- The five directions must look like five different products. Do not drift toward the kit's round 4
  look unless your direction is that look.
- 1440 and 1920 both composed. No horizontal scroll, no orphan gaps, whole rows of covers.
- No character cut by the top of a frame. No art over its source size.
- Type on your ramp only, numbers with the `num` class, AA contrast, focus rings.

## Check and report

- `npx tsc --noEmit -p .` and `npm run build` clean in `lusty-lagoon/`. scalecheck clean on your files.
- Commit on your branch, one or more commits, messages naming the direction. Do not push or merge.
- Report in five lines or fewer. The commit sha, the direction in one line, the eye order, anything
  not done and why. Detail, the direction sheet and the pass lists go in `studio/.state/r5-v<N>-report.md`
  in your worktree, not committed. Put your final 1440 and 1920 shots at
  `/tmp/claude-0/-home-user-freelancing/76496740-33b7-5e16-a5ef-af5406e9e2dd/scratchpad/r5/v<N>_1440.png`
  and `v<N>_1920.png`.
