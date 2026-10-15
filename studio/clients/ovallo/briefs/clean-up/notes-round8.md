# Round 8 notes, Ovallo hero variants, third set

Source. Filip, 2026-10-15, "the gradients and backgrounds are awful go again 5 new rounds dont use similar, go back to
my feedback video u missed comments". Task ovallo-5. Baseline is fork commit `252dd64`, the round 7 set.

## What round 7 missed

Round 7 read the video from its transcript and coarse frames. This round tracked the cursor at 4 frames a second and
cropped what it rested on. The crops are in the session scratchpad, `video6/refs_zoom.jpg`.

| Time | Filip's words | Where the cursor was | Missed in round 7 |
|---|---|---|---|
| 0m19s to 0m24s | "made the tablet or the screen bigger so it fits here" | Circling the empty space left and right of the screen | Filip watches at about 2560 CSS px wide, round 7 was tuned at 1440 and 1920 |
| 0m25s to 0m33s | "background gradient where this moves in transitions from here to here" | Along the ink to paper edge, left to right | Kept, the hard edge no longer crosses the screen |
| 0m53s to 1m01s | "this is a modern gradient background" | The pin he opened, a thin line of light on near black, glowing | Built as a generic radial haze instead |
| 1m30s | "Some of these examples would work" | A grainy, out of focus black and white blur | Built as a plain linear fade |
| 1m34s | "something a bit more serious... makes this brand look expensive" | Black and white liquid silk folds | Not built at all |
| 1m58s | after "Vertical... show you precisely" | Fluted glass ribs over a soft band of light | Built as flat stripes |
| 2m22s, 2m27s | "this is a cool background as well", "too" | A luminous fold of colour, and deep teal into silver mist | Built as faint brand blobs |

## Built, fork commit in tasks.md

Each background is an image rendered by `scripts/hero-bg.py` in brand colours only, saved to `public/dir/d/hero/`
at 16 to 27 KB, with the grain added in CSS. The hero widens to 1800px and the dashboard draws up to 1.4 times its
design size (`maxScale` on `Product`, default 1, Ovallo6 pixel identical).

1. Horizon, pin 0:58. Centred copy. A thin line of light runs along the dashboard's top edge with a lilac to sage glow
   above it, scaled with the screen.
2. Liquid, pin 1:34. Copy left, dashboard right. Lit silk folds flow behind the screen, starting right of the copy.
   Below 1800px the screen bleeds off the edge, above it the screen is contained so the silk shows around it. On a
   phone the silk sits behind the screen only.
3. Fluted, pin 1:58. Ink copy half. The other half is fluted glass with a band of light above the screen and a faint
   one below, the dashboard set into it.
4. Mist, pin 1:30. Headline, plan facts and the dashboard. A grainy mist rises from low on the left to high behind the
   screen and runs on into the plans.
5. Forest, pins 2:22 and 2:27. Copy left with the paragraph and buttons beside the headline, then a very wide
   dashboard. Deep forest above, a sage fold of light behind the screen, silver mist running into the plans.

## Checks

- Text contrast against the pixels behind it, at 2560, 1920, 1440 and 390. Lowest paragraph 4.85 to 1 (5 at 390),
  lowest muted headline line 4.91 to 1. First pass failed on 1, 2 and 5, fixed by lowering the horizon glow, moving
  the silk right of the copy and darkening the top of the forest.
- All five settle with motion on, no page errors. Board shots pass the nav paint check at all four widths.
- Ovallo6 at `?dir=0` is pixel identical after the `maxScale` change.
- baselint, four warnings kept, the nav clearing hero tops, the screen centring margin in 3 and the z-index inside the
  isolated hero.

## Recommendation

1 Horizon. It is the pin Filip opened and named a modern gradient background, it keeps the centred layout he called
semi-OK, and the light on the screen's edge makes the product the subject. 3 Fluted second, the most distinctive.
