# Round 9 notes, Ovallo hero variants, fourth set

Source. Filip, 2026-10-15, screenshots of the round 8 set with notes, then three notes on variant 5 while the round
was running. Task ovallo-5. Baseline is fork commit `b5ae114`, the round 8 set.

| # | Filip's words | What it means |
|---|---|---|
| 1 | "pixalized background", "again pixelted", "all 5 are pixaleted" | The lossy WebP at quality 82 (16 to 27 KB) blocked in the smooth gradients |
| 2 | "has cuts and random breaks" | The horizon band's rectangle showed over the ink, and each hero ended in a hard edge into the plans |
| 3 | "dashboard overflowing grid" | The screen ran to 1680 and 1840 wide, past the plans' 1312 column |
| 4 | "not following grid" | Variant 3's copy started at its own edge, and its screen sat in a half panel off the grid |
| 5 | "make sure we follow the grid on all 5 redo them again" | All five redone on the page column |
| 6 | "for this variant we can do white opacity on text" | Variant 5, the muted headline line and the paragraph become paper at an opacity, not mist |
| 7 | "and smooth transition to white" | Variant 5's mist ended in light grey and then a hard edge into the paper. Now an eased fade to paper |
| 8 | "make sure we follow grid please" | Same as 5 |

## Built, fork commit `58ba268`

- The grid. Every hero uses the plans' own column, the gutter at the sides and 1312 at most, so copy and screen edges
  land on the plans' edges. Inside it a 12 column grid with 32px gutters, 80px columns at full width. Measured at
  2560, 1920, 1440 and 390, every left edge equals the plans' left edge and every screen edge is a column line.
- The screen fills its columns exactly, the dashboard is drawn at the column's width (1.17 times its design size at
  full width).
- Backgrounds. Lossless WebP at full size, 82 to 315 KB. The colour ramps are monotone cubics, so no stop shows as a
  band. The horizon glow is transparent and fades out at every edge, the line itself is drawn in CSS. The silk is
  rendered with a margin and cropped, so its right edge has no lit column.
- The end of every hero. One eased fade, nine stops on a smoothstep, from the background into the plans paper. The
  last pixel row of each hero is the plans paper exactly, 244 242 247.

1. Horizon, pin 0m58s. Centred copy, the screen on all 12 columns, a line of light across the page at the screen's top
   edge with a lilac to sage glow rising from it.
2. Liquid, pin 1m34s. Copy on columns 1 to 6, the screen on 4 to 12 below it, silk folds in the open top right and
   around the screen.
3. Fluted, pin 1m58s. Copy left, the screen on all 12 columns, light rising through fluted glass from below.
4. Mist, pin 1m30s. The headline across, the plan facts on columns 1 to 3, the screen on 4 to 12, mist rising behind it.
5. Forest, pins 2m22s and 2m27s. The headline left, the paragraph and buttons right on the plans heading's own grid, so
   the paragraph sits straight above the plans lead (both at 1493.8px at 2560). The screen on all 12 columns. The
   muted line and the paragraph are paper at 64%.

## Checks

- Text contrast against every pixel behind it, the text colour composited when it has alpha. Lowest paragraph 5.24
  to 1 (variant 5 at 2560). Lowest muted headline line 4.13 to 1, variants 2 at 1440 and 4 at 2560, large text, the
  AA bar is 3 to 1. First pass failed variant 2's paragraph at 390, 2.68 to 1, fixed by keeping the silk behind the
  screen only.
- All five settle with motion on. Board shots pass the nav paint check at all four widths.
- baselint, three warnings kept, the z-index of -1 inside the isolated hero (two) and the 128px phone top that clears
  the fixed nav. Build passes.

## Open

- The nav runs edge to edge at the gutter, not on the 1312 column. At 2560 its logo sits at 64px and the copy at
  624px. Left as is, the nav was approved with Ovallo6. Asked Filip.
- At 2560 the grid leaves 624px of background each side of the screen. That is the cost of the grid against "bigger
  so it fits here" from the video.

## Recommendation

Variant 5. Filip's last notes were on it, its paragraph lines up with the plans lead, and its colour is the most
Ovallo of the five. Variant 1 second.
