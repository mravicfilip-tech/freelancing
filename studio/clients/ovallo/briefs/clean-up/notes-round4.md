# Round 4 notes, Ovallo clean up

Source. Filip's annotated screenshots of page D, 2026-10-15, sent one after another.

| # | Screenshot | Filip's words | What it means |
|---|---|---|---|
| 1 | Hero, the empty space where the dashboard was | "why did u place the dashboard down here? put it back" | The hero is Ovallo6's again. Round 3 note 1 was misread |
| 2 | Plans, the term rows boxed, an arrow to the bottom | (the arrow, round 3's "make this go towards here, the bottom") | The term rows stretch so the last rule meets the bottom of Subscribe |
| 3 | Why Choose band, the 01 boxed | "do icons instead of numbers" | A line icon per reason in place of 01 to 06 |
| 4 | Footer, the empty space right of the headline | "a line graphic should be here but not the one you did its awful and random - something more custom and complicated" | One custom, detailed line graphic there. Three variants for Filip to pick |
| 5 | Plans, the globe boxed | "awful graphic change it" | The globe goes |
| 6 | Testimonials, dark | "convert section to white background and lightmode" | Testimonials on paper, ink text |
| 7 | The gap between bento and add funds, with the bento's line | "section break feels so random" | Light sections alternate paper and page tone. The bento's connector line goes |

## Round 3 correction

Round 3 note 1, "make this go towards here, the bottom", was read as the hero dashboard because the cursor
ended on the hero's edge. It meant the plan rows. Lesson. When a deictic note spans two sections, ask
which element "this" is before moving anything outside the section on screen.

## Built, fork commit `f7e0451`

- Hero back to Ovallo6. Pixel identical to Ovallo6 at 2000 wide, sub pixel anti aliasing only at 1440.
- Plans rows fill the column height. The globe is gone.
- Why Choose reasons carry line icons in 32px boxes, the same treatment as the rewards perks.
- Testimonials on paper with ink text. The Trustpilot logo is split into its star and a wordmark mask so
  the wordmark takes ink.
- Rhythm. Plans paper, bento page tone, add funds and partners paper, rewards page tone, testimonials
  paper, FAQ page tone, footer ink.
- Footer graphic, three variants at `?dir=d&fg=1`, `2` and `3`, default 1. Board in chat.
  1. Mark blueprint, the Ovallo mark drawn from its own geometry with its generating ellipses and nodes.
  2. Yield curve, the three plans' APY at their terms from `src/data/plans.ts`, Growth in the accent.
  3. Contour field, nested contour lines of one landform, one line in the accent.

## Pick

Filip, "go with 1". The footer carries the mark blueprint. Variants 2 and 3 are removed from the code and
stay in fork commit `f7e0451`.
