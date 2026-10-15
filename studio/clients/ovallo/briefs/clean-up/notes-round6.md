# Round 6 notes, Ovallo hero variants

Source. Filip, 2026-10-15, in chat. Task ovallo-5. Baseline is fork commit `72c3f0f`, page D after round 5.

| # | Filip's words | What it means |
|---|---|---|
| 1 | "this hero needs to be a bit more clean and a bit more professional" | The hero gets cleaner, the rest of page D stays |
| 2 | "with the logo in the background... and the tilted mockup... It's more gamified" | The giant mark (`.vh__mark`) and the tilt (`.vh__tilt`) go in every variant |
| 3 | "some breaks or different elements where we have some of the white mode in the hero" | At least one variant breaks into paper, one is fully paper |
| 4 | "or a different correspondation of elements in the hero and we lose the tilt" | At least one variant changes what the hero shows, not only its colours |
| 5 | "Give me five variants in the end" | Five, built, on a board, Filip answers with a number |

Five layout variants go against the doctrine's one argued pick for layout. Filip asked for five outright, so they
are built, kept genuinely different, and the report ends on one recommendation.

## Built, fork commit in tasks.md

`?hero=1..5` on page D, a localhost switcher bottom centre, no param keeps the current hero. Code in
`src/dir/d/hero/HeroD.tsx` and `heroD.css`. Copy is verbatim from the current hero.

1. Break. Centred copy on ink, the dashboard flat below, crossing into a paper band that runs on into the
   plans. Close to rho.co, which Filip named as liked. Close to the round 3 move he rejected ("why did u place
   the dashboard down here? put it back"), which was a misread of a plans note, not a request for a break.
2. Paper. The hero in white mode. Copy left in ink, the flat dashboard right, cropped by the screen edge.
3. Two tone. Ink half with the copy, paper half with the phone view of the app standing flat.
4. Term sheet. No mockup. The headline at 96px, then one ruled row of facts from `src/data/plans.ts`, APY
   9.8% to 19.7%, 6 to 24 Months, Weekly, Monthly or Quarterly payouts, Ovallo Private $100,000+. The chip is
   left out so $100,000+ shows once.
5. Photograph. The lobby photo `02-treasury-lobby.webp` full bleed, the copy on a solid ink panel, no gradient
   over the photo.

Variants 4 and 5 have no dashboard, so "Discover Ovallo Private" links to the bento, where the Personalised
wealth card holds the $100,000+ offer.

## Checks

- Page D with no `?hero` is pixel identical to round 5 at 1440, apart from the sold bar corner baselint changed.
- All five settle with motion on, every revealed element at opacity 1 with no filter, no page errors.
- Phone at 390 stacks each variant. Variant 5's chip wraps its pill to a second line in the narrow panel.
- baselint, nine warnings kept. Seven are hero tops of 128 to 176px that clear the fixed nav, above the
  scale's 96. Two are a z-index of -1 inside the isolated hero.
- The board needed a retry on nav paint, see the paint gap line in `foundation/env.md`.

## Recommendation

Variant 2. It answers every note, clean, white mode, no mark, no tilt, and keeps the dashboard Coco shaped over
eight taste entries on 2026-10-08, so the client loses nothing they asked for. Variant 4 is the bolder pick,
the most serious of the five, but it drops that dashboard and the plans right below repeat its rates.
