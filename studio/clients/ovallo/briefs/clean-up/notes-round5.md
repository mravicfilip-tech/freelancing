# Round 5 notes, Ovallo clean up

Source. Filip's video "Website_Animation_and_Layout_Improvements.mp4", 2026-10-15, then "go new round".
Baseline is fork commit `526fc45`, page D after round 4.

| # | Time | Filip's words | What it means |
|---|---|---|---|
| 1 | 0m00s | "I want to only showcase the combined" | D is the page at `/`. The switcher goes. A, B and C freeze at `526fc45` |
| 2 | 0m07s | "on the 12 months here, let's add the most popular label here too" | The 12 Months row carries the Most Popular tag, beside the one in the detail |
| 3 | 0m14s | "this graph here, where it says 30,000 sold... make this bigger" | The sold bar under the raised amount gets thicker |
| 4 | 0m29s | "address this line so this box can go down" | Personalised wealth runs down to the bottom the other bento columns share |
| 5 | 0m35s | "the spacing between these can be like 8 pixels or 12 pixels at best" | Bento gaps go from 28px to 12px |
| 6 | 0m42s | "this box here needs to go up here" | Global Accounts rises to the top of Effortless crypto deposits |
| 7 | 0m46s to 1m13s | "add micro animations in these boxes... keep animating constantly" | Each bento card and the rewards card keeps a small loop running once it is in |
| 8 | 1m30s | "load in blur animations for text. And load in animations for the content... the whole website" | Text comes in out of a blur, content rises in, across the page |

Note 7 was located from the cursor. 0m46s to 0m52s is the bento, 1m01s is the rewards card, 1m11s is the
bento again. Note 4 was read from frames 0m27s to 0m32s, where the cursor sits under the Personalised card.

Risk said once before building. Constant loops and blur in are what Ovallo5 and Ovallo6 removed after
Srdjan's "too gamified". Built slow and small, every loop tied to real product behaviour, all of it off
under reduced motion.

## Built, fork commit in tasks.md

- `/` is D. `?dir=0` is Ovallo6 and `?dir=a|b|c` the frozen directions, for comparison only. No switcher.
- Plans. Most Popular tag right of "12 Months" in its row, and in the button's label for screen readers.
  The sold bar is 8px, was 4px.
- Bento at 1200 and up. Gaps 12px. Global Accounts top at 60px, the same as Effortless crypto deposits.
  All three columns end on one line, Personalised wealth stretches and its diagram centres in the taller tray.
  768 to 1199 gets the 12px gap too. Phone keeps 16px.
- Loops, in `src/dir/d/motion.css`.
  1. Effortless crypto deposits. The networks circle the mark, 140s and 200s a turn, icons upright. A
     ring leaves the hub every 4.8s.
  2. Personalised wealth. A dot with a short tail runs into the hub along each connector in turn, and the
     hub ripples.
  3. Digital treasury. The custody dot pings. A sage line settles along the OTC block trade row.
  4. Global Accounts. The live point on the yield line sends out a lilac ring.
  5. Rewards card. A glint runs round the meter ring. The perks light in turn, 2s each, the tick nudges.
- Load in. Headings blur in from 10px, other text from 6px, over 800ms. Bento headline words blur in one
  by one. Card titles and descriptions clear after their card lands. Content rises 24px over 900ms. Term
  rows, FAQ items, partner logos, Why Choose reasons and add funds chips come in one by one. The rewards
  photo settles from a 6% zoom. The footer blueprint rises in with the footer.
- Reduced motion. Everything above is off. The page is then the round 4 page plus notes 1 to 6.

## Checks

- Ovallo6 at `?dir=0` is pixel identical to the baseline shot at 1440.
- D with reduced motion, against `526fc45`. The hero and every section below the bento are pixel
  identical, shifted up 12px. Only the plans rows, the sold bar and the bento changed.
- 60 frames a second on the bento and through the FAQ reveal. The hero runs at 15 to 18 on both D and
  Ovallo6 in this container, so that cost was already there.
- baselint, two warnings kept. The 60px top offset matches the Effortless card's Ovallo6 offset. The
  z-index of -1 sits inside an isolated perk row.

## Open

- The same Most Popular tag now shows twice when 12 Months is selected, in the row and in the detail.
  Logged as a deliberate exception to Coco's 2026-10-08 rule against the same fact twice on one screen.
