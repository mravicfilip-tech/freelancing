# Round 10 notes, Ovallo hero variants, client choice

Source. Filip, 2026-10-15, four notes with screenshots after the round 9 set. Task ovallo-5. Baseline is fork commit
`8cd6c44`, the round 9 set.

| # | Filip's words | What it means |
|---|---|---|
| 1 | "do stats on here like on 4" | Variant 2 gets the plan facts in its empty columns 1 to 3, beside the screen |
| 2 | "give me preview link with hero switcher on production for client to choose" | The switcher shows on every host, a preview link for Filip first, production after his ship line on it |
| 3 | "big hover issue here" | Variant 5. Hovering a CTA widened it 30px, the pair rewrapped under the cursor and flickered |
| 4 | "i see background cut" | Under the screen the hero clipped the screen's shadow at its last row, a 5 level step |

## Built, fork commits `c19b1db` and `de8d9fc`

1. Variant 2 shows APY, Investment Term and Payout Schedule on columns 1 to 3, top aligned with the screen, as in 4.
   Ovallo Private is left out because the chip above already shows $100,000+, per the rule against the same figure
   twice in the taste log (2026-10-08).
2. The hero switcher shows on every host, bottom centre, Now and 1 to 5. A bare URL opens on Now, the current hero.
3. The hero CTAs keep one width on hover. At rest the label is centred with 41px each side, on hover it moves left
   and the arrow joins it, the same total, so nothing beside or below moves. Variant 5's column is 442 to 451px and
   two CTAs need 488, so they stack on purpose at one width. Measured at 1558 and 2560, zero movement on hover.
4. The hero clips sideways only, so the shadow runs on into the plans. Under the screen the last rows now go 234 to
   244 over 60px with no step.
5. Found in review. At 2560 variant 4's last fact row sat on grey, 1.88 to 1, because cover cropped 407px off the
   top of the mist. The mist is now sized to the hero with a shorter fade, lowest fact row 5.65 to 1.

## Review

`/uireview`, one round and one re-check, ledger ovallo-5. No open sev 1. Open sev 2 F1, the dashboard draws at 0.87
on 9 columns in 2 and 4, which is what the facts beside it cost. That is Filip's call. Six sev 3 open, two of them
pre-existing.

## Production

Filip, "deploy to production straight", so the preview step was skipped on his word. Fork commit `c8b347e` (code at
`de8d9fc`) went to production on 2026-10-15 and https://ovallo-landing.vercel.app serves it, checked by its asset
hash. The deploy script reported a failure on a live deployment, its URL read with a trailing quote, now fixed and
logged in env.md.

## After production

| # | Filip's words | What it means |
|---|---|---|
| 5 | "two buttons side by side please" | Variant 5's stacked CTAs go back side by side |

Fork commit `2ad964c`. The paragraph and buttons move to columns 8 to 12 of the hero grid, 528px, where the two fixed
width CTAs fit (488px). The paragraph no longer lines up with the plans lead. No movement on hover at 2560, 1558 and
1440, lowest contrast 5.04 to 1. Not on production yet, it needs Filip's word for this change.
