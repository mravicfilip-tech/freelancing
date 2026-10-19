# Round 4 builder brief, lusty-lagoon

One builder per variant. You own one folder, `lusty-lagoon/src/features/variants/v<N>/`, and
nothing else. Filip said "D1 to D5 yes, go. Let's look to make this look really premium 2026 UI ...
this is 50%, we need another 50% finisher from your side". The plan is his half. The finisher
list below is ours. Execution is the whole job this round.

## Read first, in this order

1. `studio/clients/lusty-lagoon/briefs/round-4/plan.md`, your variant's lines and D lines.
2. `studio/clients/lusty-lagoon/briefs/round-4/notes.md`, every note that names your variant.
3. `studio/clients/lusty-lagoon/taste.md`, the whole log. It is the rulebook. The 17:00 and 16:4x
   entries are this round.
4. Research, `studio/clients/lusty-lagoon/references/2026-10-19-round-4-research/craft/notes.md`
   (Techniques and Cheap tells) and `.../live/notes.md` (Patterns). Open the two accepted references
   in `references/2026-10-19-round-4/` with the Read tool and look at them.
5. The shared kit, `lusty-lagoon/src/features/variants/kit/` (parts.tsx, kit.css, Boards.tsx,
   ChatPanel.tsx, TopParts.tsx). It is read only for you.

## Setup

- You start in a git worktree. Run `git checkout -B r4-v<N> <base sha from your prompt>` first.
- Symlink installs from the main checkout, never install. `ln -s <main>/lusty-lagoon/node_modules lusty-lagoon/node_modules`
  and `ln -s <main>/studio/node_modules studio/node_modules` (main is given in your prompt).
- Build with `npm run build` in `lusty-lagoon/`, serve your own copy with
  `npx vite preview --port <your port> --strictPort` in the background. Free a port with
  `fuser -k <port>/tcp`, never `pkill -f`.
- Shots with `node <scratchpad>/tools/snap.mjs "<url>?still" <out.png> <w> 900 --full` at 1440 and
  1920. `?still` freezes timers and the wins strip. Open every shot with the Read tool and judge it.
- Off-scale classes. The Tailwind preset replaces the scales. Spacing keys are 0 0.5 1 2 3 4 6 8
  12 16 24, heights 4 5 6 8 9 10 11, text 12 14 16 18 20 24 28 32 40 48. Anything else (h-7, p-5,
  gap-1.5, h-12, top-5) silently does nothing. Use arbitrary values, `h-[48px]`. Check with
  `python3 <scratchpad>/tools/scalecheck.py <files>`.

## The kit you build with

- `Panel` or `className="k-surface rounded-[20px]"` for every panel, card, table and widget. Add
  `k-lit` for the one soft purple light, at most one lit panel per screen row, never two lit side by
  side. `k-well` for a sunken bar or stat box inside a panel. `k-glass` for a pinned bar.
- `k-page` on the variant root for the ground and the grain.
- `KitButton tone="primary"` for the one orange action per section. Never hardcode orange, the
  button system is still being picked on a board and the kit swaps it. `tone="purple"` is the
  secondary, `tone="dark"` the quiet one. Every primary listed in plan.md "Turns orange" for your
  folder switches to `tone="primary"`, one call site at a time.
- `NavItem` for sidebar rows. Its active treatment is also on a board, do not restyle it.
- `PromoMini`, `VividTile` (now calm two stop `k-tile` fills, hover in place), `CoverCard` (no lift,
  edge lights, play mark), `WinsStrip` (runs on its own across the row, with pause), `BetsBoard`,
  `ChatPanel`, `BalancePill` (a real menu now, pass `balance={balance}`).
- New parts. `AnimatedNumber` (rolls on change only), `CountdownLine` (one line of big numbers with
  unit labels), `SegmentBar` (thin segmented progress), `LiveDot`, `Marquee`, `spotlight` (pointer
  light, use with `k-spot` on art cards).
- If the kit lacks something, build it inside your folder. Never edit the kit. If a kit part is
  wrong, say so in your report.

## Rules that never bend

- Type ramp, 12, 14, 16, 20, 28, 40, 64. Nothing else in your folder when you finish. 64 has no
  preset key, write it `text-[64px]`. Display face
  (`font-display`, Bai Jamjuree) at 40 and 64 only, with negative tracking `tracking-[-0.02em]`.
  Heavy capitals at 20 or 28 use Switzer `font-extrabold` with `tracking-[-0.01em]`. Section labels
  12, caps, `tracking-[0.08em]`, `text-[rgb(var(--k-dim))]`.
- Colour. Orange is the primary action only, one per section. Purple is the secondary and the
  selection. Gold is prizes, money amounts, badges and pending. Green is win and live. Nothing else
  gets a saturated colour in chrome. Category art keeps its hue (D1).
- Surfaces flat or one low contrast gradient, no gradient on repeated cards, no text glow, no outer
  glow, no gloss, no bevel, no inset shadow on tabs. A 1px light edge on panels, the edge ladder in
  kit.css.
- Hover never lifts a card or shifts layout. Light the edge, scale art inside the clip.
- Art never renders larger than its source image. `public/art` sizes, girl-lei 533x1100,
  girl-floral 644x1100, girl-offshoulder 618x1036, girl-wrap 553x1036, lobby/hero-girl 1012x1012,
  giveaway-chest 420x420, slot-machine 531x900, hero-sunset 1740x907, hero-beach 1920x1259.
  A character is never cut by the top of its frame. A decorative image never crosses a panel edge,
  except where plan.md says so.
- Numbers use the `num` class (tabular figures). Money amounts right aligned in tables.
- Every state still works, empty, loading, error, long text, no access, through the existing
  `?state=` handling in your folder. Keyboard and focus rings on everything you touch.
- 1440 and 1920 both have to look composed. No horizontal scroll, no orphan gaps, rows of covers
  end on whole rows.

## The finisher, our 50 percent

Apply each where it fits your layout, never all at once on one panel.

1. One hierarchy per screen. Decide the first, second and third thing the eye lands on, and make the
   size steps say it (64 or 40, then 28, then 20). Write the order in your report.
2. Edge and light, not fill. Panels separate by the 1px edge and 16 to 24px gaps, not by colour.
3. One lit panel per row, the one that matters.
4. Live without noise. A `LiveDot` where data is live, `AnimatedNumber` on any balance or prize that
   can change, the wins strip running, nothing that flashes.
5. Controls on one height per row, 44 in content, 52 in the top bar. Radii from one ladder, 12
   controls, 16 covers and wells, 20 panels, 24 heroes.
6. Labels quiet, numbers loud. 12 caps labels over 28 or 40 numbers, as the Task Manager card does.
7. Media hover that feels physical, art scale 1.05 inside the clip over 500ms on
   `cubic-bezier(0.22,1,0.36,1)`, the edge lighting in 200ms.
8. Pinned top bar on `k-glass`, so the page slides under it.
9. Tables after the trading reference, header in one `k-well` bar, rows split by space.
10. Empty and loading states drawn as carefully as the full ones, skeletons in the real shapes.

## Check before you report

- `npx tsc --noEmit -p .` and `npm run build` clean in `lusty-lagoon/`.
- Shots at 1440 and 1920, full page, opened and judged against the two accepted references and the
  before shots in `studio/.state/shots/lusty-lagoon-r4-before/` (`v<N>_1440.png`, `v<N>_1920.png`).
- Hover a tile, a cover and the primary button with puppeteer and look at the shot.
- `scalecheck.py` on your files shows nothing new, and no text size off the ramp
  (`grep -oE "text-(\[[0-9]+px\]|[0-9]+)" -r src/features/variants/v<N>`).
- Commit on your branch with a plain message naming the variant and the notes it covers. Do not
  push and do not merge.

Report in five lines or fewer. The commit sha, what changed, the eye order, anything you could not
do and why. Detail goes in `studio/.state/r4-v<N>-report.md` in your worktree, which is not
committed.
