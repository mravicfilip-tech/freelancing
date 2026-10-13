# Round 4 panes slice

Items 8, 9 list, 11, 12, 13 and 18 in the shell. Files changed are `src/story2/shell/panes.tsx`, `shell.css`, `ui.tsx` and `src/story2/copy.ts`. Nothing is committed. The build passes, `tsc` is clean, and the preview on 4174 is stopped.

## What changed

- **Blocks on the lines.** A new `between(a, b)` in `ui.tsx` sets a block from vertical line a to vertical line b of the grid, from `--x1` to `--x5`. Every text stack, list, tab list, data line, spec row and callout now uses it, so each rule starts and ends on a drawn vertical. The old `cols()` ended 24px short of a line or inside a column.
- **Item 13 check.** A probe loaded P at 1920, 1440 and 1280 and compared the left and right edge of every `[data-rule]` element in every layer with the five vertical lines. No element was off a line at any of the three widths. The plus marks are still painted from the rules as laid out, so they follow.
- **Item 8, C1.** The marker stays in its cell on the top rule. The title and the lede moved to the bottom of the left column under the road, in a block 24px above the bottom rule. The spec row on the right is unchanged.
- **Item 9, R list.** The list sits on the bottom rule from the first to the third vertical. Each row has a 20px solid icon beside its label (factory, gear, mortarboard), 32px above and below, and a 24px gap. Rows are 114px against about 95px before.
- **Item 11, P tabs.** The tab list and its button sit at the bottom of the left column, the button 24px above the bottom rule. Rows are 64px against 56px. The active row has a 2px ink rule laid over the hairline and the full ink label, the others stay text-grey.
- **Item 12, leader lines.** Each model has anchor points in its own image pixels in `copy.ts`. `placeLeaders` in `panes.tsx` maps them through the contain fit (natural size, 78 by 66 percent box) and runs again on every stage resize and when the fonts load. Each point has a 16px ring with a 4px centre. The range points at the mast badge (T20 and N20 have no badge, so the red cover and the operator display), the capacity at a fork tine, and a third callout "Na slici" points at a plate or panel on the body.
- **Third callout fact.** The model designation, for example Linde H30 D, is already in the alt text in `copy.ts`. It adds no number and no claim. The label "Na slici" is new wording, marked dummy.
- **Item 18, AT.** The three facts are three boxes with hairlines on the first, second, third and fourth vertical, so each starts on its own vertical and all are 3 columns wide. The row sits on the bottom rule.

## Things to know

- **AT row is wider than the left column.** Three boxes that each start on a drawn vertical need the first to the fourth vertical. The third box sits at the middle of the frame, over the floor in version 5. If Filip wants it inside the left column, the boxes would start at columns 1, 3 and 5, which are not drawn lines.
- **Base layout.** `baselint --client ekotehnika` flags one line in my files, the tab row `height: 64px`. The override allows up to 56. Add 64 to `controlHeights` in `base-override.json` if 64 stays. Run without `--client`, the tool reads the wrong client (remittix).
- **C1 at 1440 by 900.** The band under the road is 224px high and the title block is 192px, so there are 8px between the curb and the title. If the C1 camera work moves the road up, there is more room.
- **P in version 2.** The Linija scene reaches into the second column pair at the bottom, so the capacity text sits over its floor lines and pallet drawing. The range text was already over it before. The fix is in the scene, not the shell.
- **06/06 marker on AT in version 5.** The count sits under a pole in the scene, as before. It moved 24px right, still behind the pole.
- **Not in my files.** The H beat rule (item 1) is drawn by `src/ui/HeroFrame.tsx` and `heroframe.css`, so item 13 for H is theirs.

## Shots

In `studio/clients/ekotehnika/briefs/ui-pass/progress`, all at 1920 by 1080.

- Version 5 before and after, `r4-panes-before-*` and `r4-panes-after-*` for c1 at k 0.5, r at 0.5, p at 0.3 and 0.7, at at 0.5.
- Version 2 and 4 before and after for p at 0.7 and at at 0.5.
- Version 5 after only for s at 0.5 and n at 0.6, to check the rule changes there.

## Follow-ups after 6a4a097

Only `shell.css` changed. Shots are `r4-panes-fu-before-*` and `r4-panes-fu-after-*` in this folder. The preview on 4174 and my before build are stopped.

- **Tab rows.** Back to 56px, on the scale. `base-override.json` is untouched.
- **C1 title fit.** The road ends at 68 percent of the screen height at both 1440 by 900 and 1920 by 1080. The C1 title is now `min(old size, max(48px, fit))`, where fit is the band left under the road less the 24px bottom inset, 24px clearance, 11px for the ink standing above the first line, the gap and the lede. At 1440 by 900 it is 48px, the lede is two lines and the gap is 8px, and the ink clears the curb by 29px (measured on the shot, 612 to 641). At 1920 by 1080 the title stays 72px and the look is as before. At 1280 by 800 the band is 144px and the block needs about 164px at the 48px floor, so the title ink touches the curb. That width is not covered by the floor, it needs the scene to leave more band.
- **P callouts in version 2.** The cells never moved relative to the stage. The capacity cell went from the right pair of columns to the left pair in 6a4a097, and the Linija plan starts at x 1063, inside the left pair, so its lines ran under the text. The range cell was already over the plan. In version 2 only, every callout is now a hard edged white cell from vertical to vertical, the bottom two run down to the bottom rule, and 2px on the left leave the grid line showing. Versions 4 and 5 are unchanged. The plan is hidden under the cells, which is the price of clear text.
- **The C at the end of "N20 do N25 C".** In Proizvodi it is clipped. `[data-wipe]` in `heroframe.css` sets `overflow: hidden`, `.sx-range` is a box exactly as wide as its text, and the Daxline C reaches past its advance, so its right terminal is cut. Setting the overflow to visible in the browser showed the full letter. In the P tabs it is not clipped. No ancestor of `.tab-range` clips at its edge, and the wipe sits on the 924px wide button. The C there is the glyph, narrow with straight terminals, at 14px with 0.08em tracking.
- **Fix in my files.** `.fig`, `.ln` and `.rlist .line` carry a right padding of 0.1em or 0.08em with the same negative margin, so any last glyph with an overhang survives the wipe and the layout does not move. `.lab` already has trailing letter spacing.
- **Fix for Proizvodi.** `shell.css` does not reach it. `sections.css` needs `.sx-range` (and `.sx-cap` if it carries data-wipe) to take `padding-right: 0.1em; margin-right: -0.1em`. The same line in `heroframe.css` under `[data-wipe]` would fix every wipe box at once, that file is not in my slice.
- **baselint.** The em values for the overhang compensation are flagged, as the existing ones in `.fig` and `.ln` were. They are glyph metrics and not spacing.
